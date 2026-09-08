-- ============================================================
-- Gives raffles the same single-image capability preorder campaigns have
-- (20260101000025_preorder_mobile_image.sql), and lets a home banner link
-- directly to a raffle the same way it already links to a preorder
-- campaign (20260101000026_home_banner_preorder_link.sql).
-- ============================================================

alter table public.raffles add column image_url text;

alter table public.home_banners
  add column raffle_id uuid references public.raffles (id) on delete set null;
