-- ============================================================
-- Public/vendedor-safe projection of `products`, WITHOUT the `cost` column.
--
-- Prior attempts (000016, 000023, 000024) tried to hide `cost` via
-- column-level GRANT/REVOKE tricks on the base table and gave up: a
-- column-level REVOKE cannot carve an exception out of an already-granted
-- table-level SELECT, and revoking table-level SELECT broke every
-- `products(count)` embed used by /admin/categorias and /admin/marcas.
-- 000024 left `grant select (cost) on public.products to anon, authenticated`
-- in place and relied on app-layer discipline only.
--
-- This view sidesteps that failure mode entirely: it's a column PROJECTION,
-- not a grant carve-out, so count(*)/aggregates against the view behave
-- like any ordinary select, and `cost` is structurally absent from its
-- result set regardless of any grant on the base table.
--
-- `security_invoker = true` makes the view run with the CALLER's
-- privileges/RLS, not the view owner's, so it still respects
-- `products_public_select_active` (anon: only status='ativo') and
-- `products_staff_select_all` (authenticated staff: everything) exactly as
-- the base table does today. We are not changing row visibility, only
-- hiding one column.
--
-- Every non-admin code path (public storefront, vendedor, customer, sitemap,
-- search API) must read this view instead of `public.products` directly.
-- Only the admin product edit/list flow (which legitimately needs cost) may
-- still query the base table, behind requireRole('admin').
-- ============================================================

create view public.products_public_v
  with (security_invoker = true) as
select
  id,
  name,
  slug,
  description,
  category_id,
  brand_id,
  model,
  condition,
  price,
  promo_price,
  stock,
  min_stock,
  sku,
  internal_code,
  status,
  featured,
  created_at,
  updated_at
from public.products;

grant select on public.products_public_v to anon, authenticated;
