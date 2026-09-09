-- ============================================================
-- "Entrada de estoque" header + items. Admin-only, full stop — a vendedor
-- never sees a receipt, its supplier, or its unit_cost.
--
-- The receipt/items rows themselves may be written directly (they don't
-- touch products.stock), unlike sales/inventory_movements which have no
-- write policy at all. The actual stock mutation + inventory_movements
-- ledger entry still only ever happens inside the SECURITY DEFINER
-- receive_stock() function (next migration), atomically with these rows,
-- so "nenhuma alteração direta de quantidade fora de função SQL atômica"
-- holds: nothing here ever touches products.stock/product_variants.stock
-- directly from the application layer.
-- ============================================================

create table public.stock_receipts (
  id uuid primary key default gen_random_uuid(),
  supplier_name text not null,
  document_number text,
  received_at date not null default current_date,
  notes text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index stock_receipts_received_at_idx on public.stock_receipts (received_at desc);
create index stock_receipts_created_by_idx on public.stock_receipts (created_by);

create table public.stock_receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.stock_receipts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  variant_id uuid references public.product_variants (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12, 2) not null check (unit_cost >= 0)
);

create index stock_receipt_items_receipt_id_idx on public.stock_receipt_items (receipt_id);
create index stock_receipt_items_product_id_idx on public.stock_receipt_items (product_id);

alter table public.stock_receipts enable row level security;
alter table public.stock_receipt_items enable row level security;

create policy "stock_receipts_admin_all" on public.stock_receipts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "stock_receipt_items_admin_all" on public.stock_receipt_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
