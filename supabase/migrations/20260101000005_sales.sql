-- ============================================================
-- sales + sale_items
-- Totals/discounts here are DENORMALIZED SNAPSHOTS written only by the
-- register_sale()/confirm_sale() functions (see migration 000011) — never
-- trust a total sent directly from the client.
-- ============================================================

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  seller_id uuid not null references public.profiles (id) on delete restrict,
  status public.sale_status not null default 'pendente',
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  total numeric(12, 2) not null check (total >= 0),
  origin text not null default 'painel_vendedor',
  notes text,
  points_generated integer not null default 0,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  updated_at timestamptz not null default now()
);

create index sales_customer_id_idx on public.sales (customer_id);
create index sales_seller_id_idx on public.sales (seller_id);
create index sales_status_idx on public.sales (status);
create index sales_created_at_idx on public.sales (created_at desc);

create trigger set_sales_updated_at
  before update on public.sales
  for each row execute function public.set_updated_at();

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  subtotal numeric(12, 2) not null check (subtotal >= 0)
);

create index sale_items_sale_id_idx on public.sale_items (sale_id);
create index sale_items_product_id_idx on public.sale_items (product_id);

alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

create policy "sales_admin_select_all"
  on public.sales for select
  to authenticated
  using (public.is_admin());

create policy "sales_seller_select_own"
  on public.sales for select
  to authenticated
  using (seller_id = auth.uid());

-- Inserts/updates to `sales` only ever happen through the SECURITY DEFINER
-- functions in migration 000011 (register_sale/confirm_sale/cancel_sale),
-- which run as the table owner and bypass RLS by design. No direct
-- insert/update/delete policy is granted here on purpose.

create policy "sale_items_admin_select_all"
  on public.sale_items for select
  to authenticated
  using (public.is_admin());

create policy "sale_items_seller_select_own"
  on public.sale_items for select
  to authenticated
  using (
    exists (
      select 1 from public.sales
      where sales.id = sale_items.sale_id
        and sales.seller_id = auth.uid()
    )
  );
