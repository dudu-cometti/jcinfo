-- ============================================================
-- Public, phone-based "check my points" lookup (spec section 19).
-- Customers are not Supabase Auth users yet (see docs/authentication.md
-- for the planned phone/e-mail login phase), so this SECURITY DEFINER
-- function is the only way an anonymous visitor can see a slice of their
-- own customer row: exact phone match only, and only name/points/rank
-- (never phone/email/notes of OTHER customers), to keep the surface small
-- while that full auth phase isn't built yet.
-- ============================================================

create or replace function public.get_customer_summary(p_phone text)
returns table (
  name text,
  points integer,
  total_spent numeric,
  rank bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.name,
    c.points,
    c.total_spent,
    (select count(*) + 1 from public.customers where points > c.points) as rank
  from public.customers c
  where c.phone = regexp_replace(p_phone, '\D', '', 'g')
  limit 1;
$$;

grant execute on function public.get_customer_summary(text) to anon, authenticated;
