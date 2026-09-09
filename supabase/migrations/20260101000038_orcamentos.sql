-- ============================================================
-- Orçamentos: a quote/simulation that NEVER creates a sale, NEVER touches
-- stock/points/commissions on its own. Every money-relevant field the
-- customer was quoted is snapshotted here (name, product, variant, image,
-- price, discount, freight, machine, fee, installments) so a later catalog
-- change can never retroactively alter an old orçamento.
--
-- Unlike sales/inventory_movements, direct insert/update IS allowed here
-- (gated by RLS to the owning seller or admin) because an orçamento has no
-- side effects on stock/points/commissions — it's pure quote data. Only
-- the eventual conversion to a real sale goes through a SECURITY DEFINER
-- function (see 000042).
-- ============================================================

create type public.orcamento_status as enum (
  'rascunho', 'enviado', 'aprovado', 'expirado', 'convertido', 'cancelado'
);

create table public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete restrict,
  customer_id uuid references public.customers (id) on delete set null,
  customer_name_snapshot text not null,
  status public.orcamento_status not null default 'rascunho',

  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  freight_value numeric(12, 2) not null default 0 check (freight_value >= 0),
  base_value numeric(12, 2) not null default 0 check (base_value >= 0),

  machine_id uuid references public.payment_machines (id) on delete set null,
  machine_name_snapshot text,
  rate_rule_id uuid references public.payment_rate_rules (id) on delete set null,
  payment_method public.payment_method,
  installments integer not null default 1 check (installments >= 1 and installments <= 18),
  percentage_applied numeric(5, 2),
  fixed_value_applied numeric(12, 2),
  rate_period_start date,
  rate_period_end date,

  final_value numeric(12, 2) not null default 0 check (final_value >= 0),
  installment_value numeric(12, 2),
  last_installment_value numeric(12, 2),

  validity_days integer not null default 3 check (validity_days > 0),
  expires_at timestamptz,
  notes text,

  converted_sale_id uuid references public.sales (id) on delete set null,
  cancelled_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orcamentos_seller_id_idx on public.orcamentos (seller_id);
create index orcamentos_customer_id_idx on public.orcamentos (customer_id);
create index orcamentos_status_idx on public.orcamentos (status);
create index orcamentos_created_at_idx on public.orcamentos (created_at desc);

create trigger set_orcamentos_updated_at
  before update on public.orcamentos
  for each row execute function public.set_updated_at();

create table public.orcamento_items (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references public.orcamentos (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name_snapshot text not null,
  variant_color_snapshot text,
  image_url_snapshot text,
  unit_price_snapshot numeric(12, 2) not null check (unit_price_snapshot >= 0),
  quantity integer not null check (quantity > 0),
  subtotal_snapshot numeric(12, 2) not null check (subtotal_snapshot >= 0),
  stock_available_at_creation integer,
  position integer not null default 0
);

create index orcamento_items_orcamento_id_idx on public.orcamento_items (orcamento_id);

alter table public.orcamentos enable row level security;
alter table public.orcamento_items enable row level security;

create policy "orcamentos_admin_all" on public.orcamentos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "orcamentos_seller_select_own" on public.orcamentos
  for select to authenticated using (seller_id = auth.uid());
create policy "orcamentos_seller_insert_own" on public.orcamentos
  for insert to authenticated
  with check (seller_id = auth.uid() and public.is_staff());
create policy "orcamentos_seller_update_own" on public.orcamentos
  for update to authenticated
  using (seller_id = auth.uid() and status not in ('convertido', 'cancelado'))
  with check (seller_id = auth.uid());

create policy "orcamento_items_admin_all" on public.orcamento_items
  for all to authenticated
  using (exists (select 1 from public.orcamentos o where o.id = orcamento_items.orcamento_id and public.is_admin()))
  with check (exists (select 1 from public.orcamentos o where o.id = orcamento_items.orcamento_id and public.is_admin()));
create policy "orcamento_items_seller_select_own" on public.orcamento_items
  for select to authenticated
  using (exists (select 1 from public.orcamentos o where o.id = orcamento_items.orcamento_id and o.seller_id = auth.uid()));
create policy "orcamento_items_seller_write_own" on public.orcamento_items
  for all to authenticated
  using (
    exists (
      select 1 from public.orcamentos o
      where o.id = orcamento_items.orcamento_id
        and o.seller_id = auth.uid()
        and o.status not in ('convertido', 'cancelado')
    )
  )
  with check (
    exists (select 1 from public.orcamentos o where o.id = orcamento_items.orcamento_id and o.seller_id = auth.uid())
  );
