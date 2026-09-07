-- ============================================================
-- Separate mobile background image for home banners: the desktop and
-- mobile hero boxes have very different aspect ratios (near-square on
-- phones, wide on desktop), so a single cropped image doesn't always frame
-- well on both. Falls back to `image_url` when unset.
-- ============================================================

alter table public.home_banners add column image_url_mobile text;
