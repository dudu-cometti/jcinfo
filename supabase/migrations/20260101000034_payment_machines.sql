-- ============================================================
-- Card-machine (acquirer) fee rules. Mirrors the commission_rules pattern
-- (000009): a rules table the admin edits, never hardcoded in application
-- code. Multiple machines are supported from day one — InfinitePay
-- (parcelas 1x-12x) and a second, admin-nameable machine (13x-18x), per
-- spec. The vendedor may only ever SELECT rules, never write them.
-- ============================================================

create table public.payment_machines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  provider_key text not null default 'generic',
  min_installments integer not null default 1 check (min_installments >= 1),
  max_installments integer not null default 12 check (max_installments >= min_installments),
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_payment_machines_updated_at
  before update on public.payment_machines
  for each row execute function public.set_updated_at();

create type public.payment_channel as enum ('maquininha', 'infinitap', 'link');
create type public.payment_method as enum ('pix', 'dinheiro', 'debito', 'credito');

create table public.payment_rate_rules (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.payment_machines (id) on delete cascade,
  channel public.payment_channel not null default 'maquininha',
  card_brand text,
  method public.payment_method not null,
  installments integer not null default 1 check (installments >= 1 and installments <= 18),
  percentage numeric(5, 2) not null default 0 check (percentage >= 0 and percentage <= 100),
  fixed_value numeric(12, 2) check (fixed_value is null or fixed_value >= 0),
  settlement_days integer,
  infinite_nitro boolean not null default false,
  revenue_tier text,
  fee_passed_to_customer boolean not null default true,
  period_start date,
  period_end date,
  status text not null default 'ativa' check (status in ('ativa', 'inativa')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_rate_rules_installments_only_for_credito check (
    method = 'credito' or installments = 1
  )
);

create index payment_rate_rules_machine_id_idx on public.payment_rate_rules (machine_id);
create index payment_rate_rules_lookup_idx on public.payment_rate_rules (machine_id, method, installments, status);

create trigger set_payment_rate_rules_updated_at
  before update on public.payment_rate_rules
  for each row execute function public.set_updated_at();

alter table public.payment_machines enable row level security;
alter table public.payment_rate_rules enable row level security;

create policy "payment_machines_staff_select" on public.payment_machines
  for select to authenticated using (public.is_staff());
create policy "payment_machines_admin_write" on public.payment_machines
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "payment_rate_rules_staff_select" on public.payment_rate_rules
  for select to authenticated using (public.is_staff());
create policy "payment_rate_rules_admin_write" on public.payment_rate_rules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Seed the two machines named in the spec. The second machine's real name
-- has not been informed yet; the admin renames it from /admin/taxas.
insert into public.payment_machines (name, provider_key, min_installments, max_installments) values
  ('InfinitePay', 'infinitepay', 1, 12),
  ('Segunda máquina', 'generic', 13, 18);
