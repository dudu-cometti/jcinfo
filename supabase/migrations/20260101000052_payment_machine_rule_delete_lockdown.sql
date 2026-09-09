-- ============================================================
-- payment_machines_admin_write / payment_rate_rules_admin_write eram
-- "for all" — o que incluía DELETE direto pela API, sem checagem alguma
-- de uso prévio em orçamento/venda. Isso é substituído por policies
-- separadas (select/insert/update, sem delete) + duas funções
-- SECURITY DEFINER que só apagam quando não há nenhum uso histórico —
-- exatamente o "não excluir se já foi usado" pedido. Sem uso nenhum,
-- a exclusão é permitida só ao admin (checado dentro da função).
-- ============================================================

drop policy "payment_machines_admin_write" on public.payment_machines;
create policy "payment_machines_admin_insert" on public.payment_machines
  for insert to authenticated with check (public.is_admin());
create policy "payment_machines_admin_update" on public.payment_machines
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy "payment_rate_rules_admin_write" on public.payment_rate_rules;
create policy "payment_rate_rules_admin_insert" on public.payment_rate_rules
  for insert to authenticated with check (public.is_admin());
create policy "payment_rate_rules_admin_update" on public.payment_rate_rules
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Nenhuma policy de delete é criada para nenhuma das duas tabelas — RLS
-- nega por padrão o que não tem policy, então DELETE direto pela API fica
-- impossível para qualquer papel a partir de agora, inclusive admin.

create or replace function public.delete_payment_machine(p_machine_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if exists (select 1 from public.orcamentos where machine_id = p_machine_id)
    or exists (select 1 from public.sales where machine_id = p_machine_id) then
    raise exception 'machine has already been used in an orcamento or sale and cannot be deleted';
  end if;

  delete from public.payment_machines where id = p_machine_id;
  if not found then
    raise exception 'machine % not found', p_machine_id;
  end if;

  perform public.log_audit('maquina_excluida', 'payment_machines', p_machine_id, null);
end;
$$;

revoke all on function public.delete_payment_machine(uuid) from public;
grant execute on function public.delete_payment_machine(uuid) to authenticated;

create or replace function public.delete_payment_rate_rule(p_rule_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if exists (select 1 from public.orcamentos where rate_rule_id = p_rule_id) then
    raise exception 'rate rule has already been used in an orcamento and cannot be deleted';
  end if;

  delete from public.payment_rate_rules where id = p_rule_id;
  if not found then
    raise exception 'rate rule % not found', p_rule_id;
  end if;

  perform public.log_audit('taxa_excluida', 'payment_rate_rules', p_rule_id, null);
end;
$$;

revoke all on function public.delete_payment_rate_rule(uuid) from public;
grant execute on function public.delete_payment_rate_rule(uuid) to authenticated;
