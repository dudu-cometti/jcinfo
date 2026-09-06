-- ============================================================
-- customers: no traditional account (yet). Phone is the dedup key.
-- ============================================================

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Normalized to digits only (DDI+DDD+number) by the application layer
  -- before insert/update, so duplicates can't slip in with different masks.
  phone text not null unique,
  email text,
  points integer not null default 0 check (points >= 0),
  total_spent numeric(12, 2) not null default 0 check (total_spent >= 0),
  last_purchase_at timestamptz,
  status text not null default 'ativo',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_phone_idx on public.customers (phone);
create index customers_points_idx on public.customers (points desc);
create index customers_name_trgm_idx on public.customers using gin (name gin_trgm_ops);

create trigger set_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

alter table public.customers enable row level security;

-- No public/anon access: customers are only visible to staff for now.
-- The future customer-facing area (section 19/22) will add a scoped policy
-- once phone/email login exists — see docs/future-whatsapp-ai.md.
create policy "customers_staff_select"
  on public.customers for select
  to authenticated
  using (public.is_staff());

create policy "customers_staff_insert"
  on public.customers for insert
  to authenticated
  with check (public.is_staff());

create policy "customers_staff_update"
  on public.customers for update
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

create policy "customers_admin_delete"
  on public.customers for delete
  to authenticated
  using (public.is_admin());
