-- ============================================================
-- simulate_card_fee ganha um parâmetro de bandeira opcional. Mesmo
-- fallback já usado em create_orcamento/update_orcamento: bandeira
-- específica é preferida quando informada; "qualquer bandeira"
-- (card_brand is null) só entra como fallback explícito quando não há
-- regra pra bandeira pedida, ou quando nenhuma bandeira foi informada.
--
-- Isso muda a lista de parâmetros da função (não é só um trailing
-- default acrescentado a uma assinatura já usada em outro lugar do
-- schema) — para o Postgres, (numeric, integer) e (numeric, integer,
-- text) são identidades diferentes, então a versão de 2 argumentos
-- precisa ser derrubada explicitamente ou ficaria como um overload
-- solto ao lado da nova, e o PostgREST não saberia qual escolher.
-- ============================================================

drop function if exists public.simulate_card_fee(numeric, integer);

create or replace function public.simulate_card_fee(
  p_value numeric,
  p_installments integer,
  p_card_brand text default null
)
returns table (
  machine_name text,
  installments integer,
  card_brand_applied text,
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
  from public.payment_machines m
  where m.status = 'ativo'
    and v_installments between m.min_installments and m.max_installments
  order by m.created_at
  limit 1;

  if not found then
    raise exception 'no machine covers % installments', v_installments;
  end if;

  select * into v_rule
  from public.payment_rate_rules r
  where r.machine_id = v_machine.id
    and r.method = 'credito'
    and r.installments = v_installments
    and r.status = 'ativa'
    and (r.period_start is null or r.period_start <= current_date)
    and (r.period_end is null or r.period_end >= current_date)
    and (
      (p_card_brand is not null and (r.card_brand = p_card_brand or r.card_brand is null))
      or (p_card_brand is null and r.card_brand is null)
    )
  order by (r.card_brand is not null) desc, r.created_at desc
  limit 1;

  if not found then
    raise exception 'no active rate rule for % installments', v_installments;
  end if;

  v_final := round((p_value + coalesce(v_rule.fixed_value, 0)) / (1 - v_rule.percentage / 100), 2);
  v_installment_value := floor(v_final / v_installments * 100) / 100;

  return query select
    v_machine.name,
    v_installments,
    v_rule.card_brand,
    v_rule.percentage,
    coalesce(v_rule.fixed_value, 0),
    v_final,
    v_installment_value,
    v_final - v_installment_value * (v_installments - 1);
end;
$$;

revoke all on function public.simulate_card_fee(numeric, integer, text) from public;
grant execute on function public.simulate_card_fee(numeric, integer, text) to anon, authenticated;
