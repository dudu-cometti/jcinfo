-- ============================================================
-- A logged-in customer is `authenticated` but not staff (is_staff() is
-- false for them), and the "public" read policies on products and
-- point_campaigns were scoped to `anon` only — written before customer
-- accounts existed (migration 20260101000020_customer_accounts.sql added
-- customers as real Supabase Auth users afterwards, and these two
-- policies were never updated to match). A customer fell through both
-- the anon policy (wrong role) and the staff policy (wrong permission),
-- so an authenticated customer saw zero products anywhere on the site,
-- and zero active point campaigns on the home page — while anonymous
-- visitors and staff were unaffected, which is why this went unnoticed.
-- ============================================================

drop policy "products_public_select_active" on public.products;
create policy "products_public_select_active"
  on public.products for select
  to anon, authenticated
  using (status = 'ativo');

drop policy "point_campaigns_public_select_active" on public.point_campaigns;
create policy "point_campaigns_public_select_active" on public.point_campaigns
  for select to anon, authenticated using (status = 'ativa');
