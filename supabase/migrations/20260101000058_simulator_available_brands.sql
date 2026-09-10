-- ============================================================
-- Lista de bandeiras que o simulador público pode oferecer como opção —
-- só as que realmente têm alguma taxa de crédito ativa cadastrada. Evita
-- o problema de digitação livre (ex: "VISA" vs "Visa" não bater com o que
-- foi cadastrado): o front passa a escolher a partir desta lista, nunca
-- digitar.
-- ============================================================

create or replace function public.simulator_available_brands()
returns table (card_brand text)
language sql
stable
security definer
set search_path = public
as $$
  select distinct r.card_brand
  from public.payment_rate_rules r
  join public.payment_machines m on m.id = r.machine_id
  where r.method = 'credito'
    and r.status = 'ativa'
    and m.status = 'ativo'
    and r.card_brand is not null
  order by r.card_brand;
$$;

revoke all on function public.simulator_available_brands() from public;
grant execute on function public.simulator_available_brands() to anon, authenticated;
