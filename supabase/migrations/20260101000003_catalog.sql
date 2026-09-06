-- ============================================================
-- Catalog: categories, products, product_images
-- ============================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  category_id uuid references public.categories (id) on delete set null,
  brand text,
  model text,
  price numeric(12, 2) not null check (price >= 0),
  promo_price numeric(12, 2) check (promo_price is null or promo_price >= 0),
  cost numeric(12, 2) check (cost is null or cost >= 0),
  stock integer not null default 0 check (stock >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  sku text unique,
  internal_code text unique,
  status public.product_status not null default 'ativo',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint promo_price_lower_than_price check (
    promo_price is null or promo_price < price
  )
);

create extension if not exists pg_trgm;

create index products_category_id_idx on public.products (category_id);
create index products_status_idx on public.products (status);
create index products_featured_idx on public.products (featured) where featured = true;
create index products_low_stock_idx on public.products (stock) where stock <= min_stock;
create index products_name_trgm_idx on public.products using gin (name gin_trgm_ops);

create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images (product_id);

-- --- RLS ---

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;

-- Public catalog: anyone (including anon) can read active products/categories.
create policy "categories_public_select"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "categories_admin_write"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "products_public_select_active"
  on public.products for select
  to anon
  using (status = 'ativo');

create policy "products_staff_select_all"
  on public.products for select
  to authenticated
  using (public.is_staff());

create policy "products_admin_write"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "product_images_public_select"
  on public.product_images for select
  to anon, authenticated
  using (true);

create policy "product_images_admin_write"
  on public.product_images for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
