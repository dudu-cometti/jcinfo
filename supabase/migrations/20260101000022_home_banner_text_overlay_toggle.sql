-- ============================================================
-- Some banner images are already fully designed (headline, CTA, everything
-- baked into the photo/graphic itself) — overlaying the title/subtitle/
-- button text on top of those duplicates what's already in the image.
-- This toggle lets the admin turn that text overlay off per banner, in
-- which case the whole image becomes the clickable link (cta_href) if set.
-- ============================================================

alter table public.home_banners add column show_text_overlay boolean not null default true;
