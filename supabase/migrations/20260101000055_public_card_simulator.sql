-- ============================================================
-- Simulador público de parcelamento no cartão (sem login).
--
-- payment_machines/payment_rate_rules continuam staff-only via RLS — nada
-- muda aí. Estas duas funções SECURITY DEFINER são a única via pública:
-- elas leem as regras internamente (bypassam RLS como owner, igual a todo
-- o resto do projeto) e devolvem só o resultado calculado, nunca as
-- linhas cruas de payment_rate_rules.
--
-- simulator_installment_bounds(): menor min_installments e maior
-- max_installments entre as máquinas ativas, pra o front montar o select
-- de parcelas sem hardcode.
--
-- simulate_card_fee(): sempre método 'credito', sem bandeira específica
-- (fallback "qualquer bandeira"), resolve automaticamente qual máquina
-- cobre aquele número de parcelas (InfinitePay 1-12, a segunda máquina
-- 13-18) e aplica a mesma fórmula de repasse de taxa usada no resto do
-- sistema. Nunca aceita nem devolve nada além de valor/parcelas — não é
-- uma via de escrita, só leitura calculada.
-- ============================================================

create or replace function public.simulator_installment_bounds()
returns table (min_installments integer, max_installments integer)
language sql
stable
security definer
set search_path = public
as $$
  select min(min_installments), max(max_installments)
  from public.payment_machines
  where status = 'ativo';
$$;

revoke all on function public.simulator_installment_bounds() from public;
grant execute on function public.simulator_installment_bounds() to anon, authenticated;

create or replace function public.simulate_card_fee(p_value numeric, p_installments integer)
returns table (
  machine_name text,
  installments integer,
  percentage_applied numeric,
  fixed_value_applied numeric,
  final_value numeric,
  installment_value numeric,
  last_installment_value numeric
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_machine public.payment_machines%rowtype;
  v_rule public.payment_rate_rules%rowtype;
  v_installments integer := greatest(1, coalesce(p_installments, 1));
  v_final numeric(12, 2);
  v_installment_value numeric(12, 2);
begin
  if p_value is null or p_value <= 0 then
    raise exception 'invalid value';
  end if;

  select * into v_machine
  from public.payment_machines
  where status = 'ativo'
    and v_installments between min_installments and max_installments
  order by created_at
  limit 1;

  if not found then
    raise exception 'no machine covers % installments', v_installments;
  end if;

  select * into v_rule
  from public.payment_rate_rules
  where machine_id = v_machine.id
    and method = 'credito'
    and installments = v_installments
    and card_brand is null
    and status = 'ativa'
    and (period_start is null or period_start <= current_date)
    and (period_end is null or period_end >= current_date)
  order by created_at desc
  limit 1;

  if not found then
    raise exception 'no active rate rule for % installments', v_installments;
  end if;

  v_final := round((p_value + coalesce(v_rule.fixed_value, 0)) / (1 - v_rule.percentage / 100), 2);
  v_installment_value := floor(v_final / v_installments * 100) / 100;

  return query select
    v_machine.name,
    v_installments,
    v_rule.percentage,
    coalesce(v_rule.fixed_value, 0),
    v_final,
    v_installment_value,
    v_final - v_installment_value * (v_installments - 1);
end;
$$;

revoke all on function public.simulate_card_fee(numeric, integer) from public;
grant execute on function public.simulate_card_fee(numeric, integer) to anon, authenticated;

-- Rate limit específico — mesmo padrão das outras ações públicas
-- (000049): sem bucket/limite/janela vindos do cliente.
create or replace function public.check_simulator_rate_limit(p_ip text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return public.check_rate_limit('simulator:' || coalesce(p_ip, 'unknown'), 30, 3600);
end;
$$;

revoke all on function public.check_simulator_rate_limit(text) from public;
grant execute on function public.check_simulator_rate_limit(text) to anon, authenticated;
