-- ============================================================
-- Extra indexes for admin dashboard / reports (spec section 16),
-- which filter heavily by confirmation/creation date and status.
-- ============================================================

create index sales_confirmed_at_idx on public.sales (confirmed_at desc);
create index customers_created_at_idx on public.customers (created_at desc);
create index points_transactions_created_at_idx on public.points_transactions (created_at desc);
