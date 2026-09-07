-- ============================================================
-- Lets a home banner be linked directly to a preorder campaign: instead of
-- uploading a separate image and typing the link by hand, the admin picks
-- a campaign and the banner inherits its image and public signup URL live
-- (see src/app/(public)/page.tsx), so editing the campaign's image later
-- also updates the banner without a second upload.
-- ============================================================

alter table public.home_banners
  add column preorder_campaign_id uuid references public.preorder_campaigns (id) on delete set null;
