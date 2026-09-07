-- ============================================================
-- Admin-managed homepage hero carousel. Independent of campaigns/
-- pre-orders/products on purpose: the admin decides what to feature and in
-- what order (a pre-order, a points campaign, a plain promo, or nothing
-- beyond the default), rather than the homepage auto-picking content.
-- ============================================================

create table public.home_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  cta_label text,
  cta_href text,
  image_url text,
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index home_banners_active_position_idx on public.home_banners (active, position);

create trigger set_home_banners_updated_at
  before update on public.home_banners
  for each row execute function public.set_updated_at();

alter table public.home_banners enable row level security;

create policy "home_banners_public_select"
  on public.home_banners for select
  to anon, authenticated
  using (true);

create policy "home_banners_admin_write"
  on public.home_banners for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Seed the banner that already exists as hardcoded homepage copy, so the
-- home doesn't go blank the moment this migration runs.
insert into public.home_banners (title, subtitle, cta_label, cta_href, position, active) values
  (
    'Celulares, notebooks e eletrônicos',
    'Compre pelo WhatsApp e acumule pontos a cada compra confirmada.',
    'Ver produtos',
    '/produtos',
    0,
    true
  );

-- If the iPhone 18 demo pre-order created earlier in this environment still
-- exists, feature it too, as a working example of a second slide.
insert into public.home_banners (title, subtitle, cta_label, cta_href, position, active)
select
  'Pré-venda: ' || name,
  coalesce(description, 'Garanta o seu antes de todo mundo.'),
  'Entrar na lista',
  '/pre-venda/' || slug,
  1,
  true
from public.preorder_campaigns
where slug = 'iphone-18';
