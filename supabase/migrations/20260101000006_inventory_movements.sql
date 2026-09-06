-- ============================================================
-- inventory_movements: append-only history of every stock change
-- ============================================================

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete restrict,
  type public.inventory_movement_type not null,
  quantity integer not null,
  reason text,
  sale_id uuid references public.sales (id) on delete set null,
  user_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index inventory_movements_product_id_idx on public.inventory_movements (product_id);
create index inventory_movements_sale_id_idx on public.inventory_movements (sale_id);
create index inventory_movements_created_at_idx on public.inventory_movements (created_at desc);

alter table public.inventory_movements enable row level security;

create policy "inventory_movements_staff_select"
  on public.inventory_movements for select
  to authenticated
  using (public.is_staff());

-- Manual adjustments (type = 'entrada' | 'saida' | 'ajuste') are admin-only.
-- Movements of type 'venda'/'cancelamento'/'estorno' are written exclusively
-- by the sale functions in migration 000011.
create policy "inventory_movements_admin_manual_insert"
  on public.inventory_movements for insert
  to authenticated
  with check (public.is_admin() and type in ('entrada', 'saida', 'ajuste'));
