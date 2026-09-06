-- ============================================================
-- points_transactions: append-only ledger. customers.points is a cache
-- that must only ever change alongside a row inserted here.
-- ============================================================

create table public.points_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  type public.points_movement_type not null,
  points integer not null,
  reason text not null,
  sale_id uuid references public.sales (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index points_transactions_customer_id_idx on public.points_transactions (customer_id);
create index points_transactions_sale_id_idx on public.points_transactions (sale_id);

alter table public.points_transactions enable row level security;

create policy "points_transactions_staff_select"
  on public.points_transactions for select
  to authenticated
  using (public.is_staff());

-- Manual point adjustments are admin-only; sale-driven entries/reversals are
-- written by the SECURITY DEFINER sale functions in migration 000011.
create policy "points_transactions_admin_manual_insert"
  on public.points_transactions for insert
  to authenticated
  with check (public.is_admin() and type = 'ajuste');
