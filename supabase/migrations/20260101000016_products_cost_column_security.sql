-- ============================================================
-- Restrict products.cost at the COLUMN level, not just in the UI.
--
-- RLS in Postgres is row-level only: the existing "products_staff_select_all"
-- policy (is_staff(), i.e. admin OR vendedor) has to stay as-is, because
-- vendedor-facing joins (e.g. sale_items -> products for name/sku on their
-- own sale details) rely on it and would silently break if it were
-- restricted to admin-only. So a vendedor's session — and worse, the public
-- NEXT_PUBLIC_SUPABASE_ANON_KEY shipped to every browser — currently has
-- table-level SELECT on every column via Supabase's default grants,
-- meaning cost was readable by anyone crafting their own REST call, even
-- though no application code ever asks for it.
--
-- Fix: revoke the blanket column access and re-grant SELECT only on the
-- non-sensitive columns for anon/authenticated. `cost` becomes unreadable
-- via the regular (anon-key) client for EVERYONE, admin included — admin's
-- own read of it (product edit page) goes through the service-role client
-- instead (see src/app/admin/produtos/[id]/page.tsx), which bypasses
-- grants entirely and is already gated by requireRole('admin').
--
-- Writes are untouched by this migration: INSERT/UPDATE/DELETE on
-- `products` were already admin-only at the RLS level via
-- "products_admin_write" (migration 000003), so admin's regular session
-- can still create/edit products (cost included) normally.
-- ============================================================

revoke select on public.products from anon, authenticated;

grant select (
  id, name, slug, description, category_id, brand, model, price, promo_price,
  stock, min_stock, sku, internal_code, status, featured, created_at, updated_at
) on public.products to anon, authenticated;
