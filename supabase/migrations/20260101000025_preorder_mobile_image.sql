-- ============================================================
-- Separate mobile background image for preorder campaigns, mirroring
-- home_banners (20260101000021_home_banner_mobile_image.sql): the desktop
-- side panel and the stacked mobile panel crop differently, so a single
-- image doesn't always frame well on both. Falls back to `image_url` when
-- unset.
-- ============================================================

alter table public.preorder_campaigns add column image_url_mobile text;
