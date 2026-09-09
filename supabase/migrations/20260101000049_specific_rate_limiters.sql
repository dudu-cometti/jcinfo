-- ============================================================
-- check_rate_limit (000033) era chamável diretamente por anon/authenticated
-- com bucket/máximo/janela livres — o próprio cliente podia escolher um
-- máximo absurdo (ou uma janela de 1 segundo) e sempre passar, ou colidir
-- de propósito com o bucket de outra pessoa. Isso não é um rate limit,
-- é decoração.
--
-- A partir de agora check_rate_limit deixa de ser chamável por
-- anon/authenticated — só por outras funções SECURITY DEFINER (que
-- executam como o owner, não afetado pelo revoke). Cada fluxo público
-- ganha uma função específica, com bucket derivado internamente (prefixo
-- fixo + IP) e limite/janela fixos no servidor, não vindos do cliente.
-- ============================================================

revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;

create or replace function public.check_lead_rate_limit(p_ip text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.check_rate_limit('lead:' || coalesce(p_ip, 'unknown'), 5, 3600);
end;
$$;
revoke all on function public.check_lead_rate_limit(text) from public;
grant execute on function public.check_lead_rate_limit(text) to anon, authenticated;

create or replace function public.check_preorder_rate_limit(p_ip text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.check_rate_limit('preorder:' || coalesce(p_ip, 'unknown'), 5, 3600);
end;
$$;
revoke all on function public.check_preorder_rate_limit(text) from public;
grant execute on function public.check_preorder_rate_limit(text) to anon, authenticated;

create or replace function public.check_raffle_rate_limit(p_ip text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.check_rate_limit('raffle:' || coalesce(p_ip, 'unknown'), 5, 3600);
end;
$$;
revoke all on function public.check_raffle_rate_limit(text) from public;
grant execute on function public.check_raffle_rate_limit(text) to anon, authenticated;

create or replace function public.check_orcamento_image_rate_limit(p_ip text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.check_rate_limit('orcamento_image:' || coalesce(p_ip, 'unknown'), 30, 3600);
end;
$$;
revoke all on function public.check_orcamento_image_rate_limit(text) from public;
grant execute on function public.check_orcamento_image_rate_limit(text) to anon, authenticated;
