-- ============================================================
-- `preorder_campaigns_public_select` (000018) was `using (true)` — it
-- exposed campaigns of EVERY status (aberta/encerrada/cancelada) to anon
-- and authenticated visitors alike, unlike `point_campaigns_public_select_active`
-- which correctly filters `using (status = 'ativa')`. The only thing hiding
-- closed campaigns so far was application-layer filtering in
-- src/app/(public)/pre-venda/page.tsx — not a real security boundary.
--
-- Fix: replace the wide-open policy with a status-filtered one for
-- anon/authenticated, and add a separate staff policy so the admin's own
-- /admin/pre-vendas listing (which needs every status) doesn't regress.
-- ============================================================

drop policy "preorder_campaigns_public_select" on public.preorder_campaigns;

create policy "preorder_campaigns_public_select_open"
  on public.preorder_campaigns for select
  to anon, authenticated
  using (status = 'aberta');

create policy "preorder_campaigns_staff_select_all"
  on public.preorder_campaigns for select
  to authenticated
  using (public.is_staff());
