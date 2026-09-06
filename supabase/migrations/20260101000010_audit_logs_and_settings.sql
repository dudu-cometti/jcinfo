-- ============================================================
-- audit_logs (append-only) + site_settings (single row of key/value config)
-- ============================================================

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  resource_table text not null,
  resource_id uuid,
  data jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_user_id_idx on public.audit_logs (user_id);
create index audit_logs_resource_idx on public.audit_logs (resource_table, resource_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

create policy "audit_logs_admin_select" on public.audit_logs
  for select to authenticated using (public.is_admin());

-- Inserted exclusively via public.log_audit() (SECURITY DEFINER, see
-- migration 000011), so no direct insert policy is granted here.

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger set_site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

alter table public.site_settings enable row level security;

-- Public settings (e.g. whatsapp number) must be readable by anon visitors.
create policy "site_settings_public_select" on public.site_settings
  for select to anon, authenticated using (true);

create policy "site_settings_admin_write" on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.site_settings (key, value) values
  ('whatsapp_number', '""'::jsonb),
  ('site_name', '"JC Info"'::jsonb);
