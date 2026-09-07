-- ============================================================
-- Pre-order campaigns: "sign up now for the iPhone 18" style landing pages,
-- for products that don't exist in the catalog yet. Independent of
-- `products`/`point_campaigns` on purpose — a pre-order is a marketing
-- capture mechanism, not a sale or a points campaign, and the admin decides
-- the real benefit (reward and/or discount) manually per signup once the
-- device actually arrives.
-- ============================================================

create type public.preorder_status as enum ('aberta', 'encerrada', 'cancelada');

create table public.preorder_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  expected_price numeric(12, 2) check (expected_price is null or expected_price >= 0),
  expected_date date,
  discount_percentage numeric(5, 2) check (
    discount_percentage is null or (discount_percentage >= 0 and discount_percentage <= 100)
  ),
  reward_id uuid references public.rewards (id) on delete set null,
  status public.preorder_status not null default 'aberta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_preorder_campaigns_updated_at
  before update on public.preorder_campaigns
  for each row execute function public.set_updated_at();

-- One signup per customer per campaign — re-submitting the form just means
-- "still interested", not a second entry.
create table public.preorder_signups (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.preorder_campaigns (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  converted boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  unique (campaign_id, customer_id)
);

create index preorder_signups_campaign_id_idx on public.preorder_signups (campaign_id);
create index preorder_signups_customer_id_idx on public.preorder_signups (customer_id);

-- --- RLS ---

alter table public.preorder_campaigns enable row level security;

create policy "preorder_campaigns_public_select"
  on public.preorder_campaigns for select
  to anon, authenticated
  using (true);

create policy "preorder_campaigns_admin_write"
  on public.preorder_campaigns for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

alter table public.preorder_signups enable row level security;

-- No anon insert policy: signups from the public landing page go through
-- the service-role client (same pattern as customer leads in
-- lib/actions/leads.ts), since an anonymous visitor otherwise has no way to
-- write a row here without also being able to read other customers' data.
create policy "preorder_signups_staff_select"
  on public.preorder_signups for select
  to authenticated
  using (public.is_staff());

create policy "preorder_signups_staff_insert"
  on public.preorder_signups for insert
  to authenticated
  with check (public.is_staff());

create policy "preorder_signups_admin_update"
  on public.preorder_signups for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "preorder_signups_admin_delete"
  on public.preorder_signups for delete
  to authenticated
  using (public.is_admin());
