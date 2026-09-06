-- ============================================================
-- rewards, point_campaigns, campaign_rewards, raffles, raffle_entries,
-- raffle_winners
-- ============================================================

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  quantity integer not null default 0 check (quantity >= 0),
  points_required integer not null check (points_required > 0),
  status text not null default 'ativo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_rewards_updated_at
  before update on public.rewards
  for each row execute function public.set_updated_at();

create table public.point_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  min_points integer not null check (min_points > 0),
  start_date timestamptz not null,
  end_date timestamptz not null,
  status public.campaign_status not null default 'rascunho',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint point_campaigns_date_range check (end_date > start_date)
);

create index point_campaigns_status_idx on public.point_campaigns (status);
create index point_campaigns_featured_idx on public.point_campaigns (featured) where featured = true;

create trigger set_point_campaigns_updated_at
  before update on public.point_campaigns
  for each row execute function public.set_updated_at();

-- A campaign can offer several reward tiers, and a reward can be reused by
-- more than one campaign, hence the join table (see spec section 26).
create table public.campaign_rewards (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.point_campaigns (id) on delete cascade,
  reward_id uuid not null references public.rewards (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (campaign_id, reward_id)
);

create index campaign_rewards_campaign_id_idx on public.campaign_rewards (campaign_id);
create index campaign_rewards_reward_id_idx on public.campaign_rewards (reward_id);

create table public.raffles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  reward_id uuid references public.rewards (id) on delete set null,
  campaign_id uuid references public.point_campaigns (id) on delete set null,
  raffle_date timestamptz not null,
  status public.raffle_status not null default 'aberto',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_raffles_updated_at
  before update on public.raffles
  for each row execute function public.set_updated_at();

create table public.raffle_entries (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references public.raffles (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (raffle_id, customer_id)
);

create index raffle_entries_raffle_id_idx on public.raffle_entries (raffle_id);
create index raffle_entries_customer_id_idx on public.raffle_entries (customer_id);

-- Append-only: a raffle result is never silently overwritten (spec section 12).
-- Drawing a new winner for an already-decided raffle requires a new row plus
-- an audit_logs entry explaining the correction — never an UPDATE/DELETE.
create table public.raffle_winners (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references public.raffles (id) on delete restrict,
  customer_id uuid not null references public.customers (id) on delete restrict,
  drawn_by uuid not null references public.profiles (id) on delete restrict,
  drawn_at timestamptz not null default now(),
  notes text
);

create index raffle_winners_raffle_id_idx on public.raffle_winners (raffle_id);

-- --- RLS ---

alter table public.rewards enable row level security;
alter table public.point_campaigns enable row level security;
alter table public.campaign_rewards enable row level security;
alter table public.raffles enable row level security;
alter table public.raffle_entries enable row level security;
alter table public.raffle_winners enable row level security;

create policy "rewards_public_select" on public.rewards
  for select to anon, authenticated using (true);
create policy "rewards_admin_write" on public.rewards
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "point_campaigns_public_select_active" on public.point_campaigns
  for select to anon using (status = 'ativa');
create policy "point_campaigns_staff_select_all" on public.point_campaigns
  for select to authenticated using (public.is_staff());
create policy "point_campaigns_admin_write" on public.point_campaigns
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "campaign_rewards_public_select" on public.campaign_rewards
  for select to anon, authenticated using (true);
create policy "campaign_rewards_admin_write" on public.campaign_rewards
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "raffles_public_select" on public.raffles
  for select to anon, authenticated using (true);
create policy "raffles_admin_write" on public.raffles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "raffle_entries_staff_select" on public.raffle_entries
  for select to authenticated using (public.is_staff());
create policy "raffle_entries_admin_write" on public.raffle_entries
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "raffle_winners_public_select" on public.raffle_winners
  for select to anon, authenticated using (true);
create policy "raffle_winners_admin_insert" on public.raffle_winners
  for insert to authenticated with check (public.is_admin());
