-- ============================================================
-- Brands as a first-class entity (mirrors categories), replacing the old
-- free-text products.brand column. Category answers "what kind of thing is
-- this" (Celulares, Notebooks...); brand answers "who makes/sells it"
-- (Apple, Xiaomi, Dell...) — two independent filters, same as any real
-- catalog. Existing distinct brand text values are backfilled as rows here
-- so no product loses its brand during the migration.
-- ============================================================

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_brands_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

alter table public.products add column brand_id uuid references public.brands (id) on delete set null;
create index products_brand_id_idx on public.products (brand_id);

insert into public.brands (name, slug)
select distinct
  trim(brand),
  lower(regexp_replace(regexp_replace(trim(brand), '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g'))
from public.products
where brand is not null and trim(brand) <> ''
on conflict (slug) do nothing;

update public.products p
set brand_id = b.id
from public.brands b
where trim(p.brand) = b.name;

alter table public.products drop column brand;

-- --- RLS (same shape as categories) ---

alter table public.brands enable row level security;

create policy "brands_public_select"
  on public.brands for select
  to anon, authenticated
  using (true);

create policy "brands_admin_write"
  on public.brands for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- The column-level SELECT restriction from migration 000016 only lists
-- columns that existed at the time — brand_id is new and needs its own grant.
grant select (brand_id) on public.products to anon, authenticated;
