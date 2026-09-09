-- ============================================================
-- Lightweight DB-backed rate limiter for unauthenticated public endpoints
-- (preorder signups, the orçamento share-image route). No external CAPTCHA
-- provider is configured in this project, so we don't add one — a simple
-- sliding-window counter, enforced server-side via a SECURITY DEFINER
-- function, is proportionate and needs no new dependency.
--
-- The table itself is never read/written directly by app code (no
-- select/insert policy is granted to anon/authenticated) — every access
-- goes through check_rate_limit(), which runs as the table owner.
-- ============================================================

create table public.rate_limit_hits (
  id bigint generated always as identity primary key,
  bucket_key text not null,
  created_at timestamptz not null default now()
);

create index rate_limit_hits_bucket_created_idx on public.rate_limit_hits (bucket_key, created_at desc);

alter table public.rate_limit_hits enable row level security;

create or replace function public.check_rate_limit(
  p_bucket_key text,
  p_max_hits integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  delete from public.rate_limit_hits
  where bucket_key = p_bucket_key and created_at < now() - make_interval(secs => p_window_seconds);

  select count(*) into v_count from public.rate_limit_hits where bucket_key = p_bucket_key;

  if v_count >= p_max_hits then
    return false;
  end if;

  insert into public.rate_limit_hits (bucket_key) values (p_bucket_key);
  return true;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to anon, authenticated;
