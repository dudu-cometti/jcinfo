-- ============================================================
-- Fix a regression from migration 000016_products_cost_column_security.sql:
-- revoking table-level SELECT on `products` and re-granting only specific
-- columns broke every `count(*)`-style query against the table — Postgres
-- requires table-level SELECT for COUNT(*), no column-level grant
-- satisfies it (confirmed directly: PostgREST's `products(count)` embed,
-- used by /admin/categorias and /admin/marcas to show how many products
-- are in each category/brand, started failing with "permission denied for
-- table products" for every authenticated request, silently rendering
-- both pages as if no categories/brands existed at all).
--
-- Fix: restore table-level SELECT (so COUNT(*) and existence checks work
-- again), then revoke SELECT on just the `cost` column specifically —
-- unlike the previous approach, a table-level GRANT plus a column-level
-- REVOKE for one column DOES compose correctly in Postgres (it's the
-- reverse order — revoking a column from a blanket grant — that doesn't).
-- ============================================================

grant select on public.products to anon, authenticated;
revoke select (cost) on public.products from anon, authenticated;
