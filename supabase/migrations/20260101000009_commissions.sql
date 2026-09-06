-- ============================================================
-- commission_rules + commissions
-- The rule is configurable data, never hardcoded in application code.
-- ============================================================

create table public.commission_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  percentage numeric(5, 2) check (percentage is null or (percentage >= 0 and percentage <= 100)),
  fixed_value numeric(12, 2) check (fixed_value is null or fixed_value >= 0),
  description text,
  period_start date,
  period_end date,
  status text not null default 'ativa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint commission_rules_has_value check (percentage is not null or fixed_value is not null)
);

create trigger set_commission_rules_updated_at
  before update on public.commission_rules
  for each row execute function public.set_updated_at();

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete restrict,
  seller_id uuid not null references public.profiles (id) on delete restrict,
  rule_id uuid references public.commission_rules (id) on delete set null,
  sale_amount numeric(12, 2) not null check (sale_amount >= 0),
  percentage_applied numeric(5, 2),
  fixed_value_applied numeric(12, 2),
  commission_amount numeric(12, 2) not null check (commission_amount >= 0),
  status public.commission_status not null default 'pendente',
  period text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index commissions_sale_id_idx on public.commissions (sale_id);
create index commissions_seller_id_idx on public.commissions (seller_id);
create index commissions_status_idx on public.commissions (status);

create trigger set_commissions_updated_at
  before update on public.commissions
  for each row execute function public.set_updated_at();

alter table public.commission_rules enable row level security;
alter table public.commissions enable row level security;

create policy "commission_rules_admin_all" on public.commission_rules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "commissions_admin_select_all" on public.commissions
  for select to authenticated using (public.is_admin());

create policy "commissions_seller_select_own" on public.commissions
  for select to authenticated using (seller_id = auth.uid());

-- Status transitions (pendente -> aprovada -> paga, or -> cancelada) are
-- admin-only and go through the application layer, never the seller.
create policy "commissions_admin_update" on public.commissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
