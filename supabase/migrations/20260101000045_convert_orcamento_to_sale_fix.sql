-- ============================================================
-- CRÍTICO: corrige convert_orcamento_to_sale.
--
-- A versão anterior (000042) chamava register_sale() — que recalcula
-- subtotal a partir dos preços ATUAIS de products/product_variants — e
-- depois sobrescrevia sales.total com o final_value do orçamento. Isso
-- podia deixar sales.total inconsistente com sales.subtotal/discount/itens
-- sempre que o preço do produto tivesse mudado entre a criação do
-- orçamento e a conversão, e sempre atribuía a venda a auth.uid() (quem
-- clicou converter), perdendo o vendedor original quando o admin convertia
-- em nome de outra pessoa.
--
-- Esta versão usa exclusivamente os valores já validados e travados no
-- orçamento (snapshot de preço, subtotal, desconto, frete, taxa, parcelas,
-- total) — nunca chama register_sale/confirm_sale, então subtotal/
-- desconto/frete/taxa/total/itens da venda vêm sempre da MESMA fonte já
-- validada e não podem ficar mutuamente inconsistentes. Estoque e status
-- de produto/variante são revalidados contra o banco AGORA (dados vivos),
-- exatamente como antes — só o preço não é re-derivado, porque o preço
-- combinado com o cliente é o do orçamento aprovado, não o preço atual do
-- catálogo. seller_id da venda é sempre o seller_id original do
-- orçamento, mesmo quando quem converte é o admin.
-- ============================================================

create or replace function public.convert_orcamento_to_sale(p_orcamento_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_orcamento public.orcamentos%rowtype;
  v_item record;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_available integer;
  v_sale_id uuid;
  v_points integer;
  v_rule public.commission_rules%rowtype;
  v_percentage_applied numeric(5, 2);
  v_fixed_applied numeric(12, 2);
  v_commission_amount numeric(12, 2);
begin
  if not public.is_staff() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select * into v_orcamento from public.orcamentos where id = p_orcamento_id for update;
  if not found then
    raise exception 'orcamento % not found', p_orcamento_id;
  end if;

  if v_orcamento.seller_id <> auth.uid() and not public.is_admin() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if v_orcamento.status not in ('enviado', 'aprovado') then
    raise exception 'orcamento % cannot be converted from status %', p_orcamento_id, v_orcamento.status;
  end if;

  if v_orcamento.expires_at is not null and v_orcamento.expires_at < now() then
    update public.orcamentos set status = 'expirado' where id = p_orcamento_id;
    raise exception 'orcamento % has expired', p_orcamento_id;
  end if;

  if v_orcamento.customer_id is null then
    raise exception 'orcamento % has no linked customer to convert to a sale', p_orcamento_id;
  end if;

  if not exists (select 1 from public.orcamento_items where orcamento_id = p_orcamento_id) then
    raise exception 'orcamento % has no items', p_orcamento_id;
  end if;

  -- Revalida disponibilidade/status ao vivo, mas o PREÇO usado é sempre o
  -- snapshot do orçamento (unit_price_snapshot), nunca o preço atual.
  for v_item in select * from public.orcamento_items where orcamento_id = p_orcamento_id
  loop
    if v_item.product_id is null then
      raise exception 'orcamento item references a deleted product; cannot convert';
    end if;

    select * into v_product from public.products where id = v_item.product_id for share;
    if not found or v_product.status <> 'ativo' then
      raise exception 'product in orcamento is no longer available';
    end if;

    if v_item.variant_id is not null then
      select * into v_variant from public.product_variants where id = v_item.variant_id for share;
      if not found or v_variant.status <> 'ativo' then
        raise exception 'variant in orcamento is no longer available';
      end if;
      v_available := v_variant.stock;
    else
      v_available := v_product.stock;
    end if;

    if v_available < v_item.quantity then
      raise exception 'insufficient stock for % (available %, requested %)',
        v_product.name, v_available, v_item.quantity;
    end if;
  end loop;

  insert into public.sales (
    customer_id, seller_id, status, subtotal, discount, total, origin, notes,
    orcamento_id, freight_value, machine_id, payment_method, installments,
    percentage_applied, fixed_value_applied, card_brand_applied
  ) values (
    v_orcamento.customer_id, v_orcamento.seller_id, 'pendente',
    v_orcamento.subtotal, v_orcamento.discount, v_orcamento.final_value, 'orcamento_convertido', v_orcamento.notes,
    v_orcamento.id, v_orcamento.freight_value, v_orcamento.machine_id, v_orcamento.payment_method, v_orcamento.installments,
    v_orcamento.percentage_applied, v_orcamento.fixed_value_applied, v_orcamento.card_brand_snapshot
  )
  returning id into v_sale_id;

  for v_item in select * from public.orcamento_items where orcamento_id = p_orcamento_id
  loop
    insert into public.sale_items (sale_id, product_id, variant_id, quantity, unit_price, discount, subtotal)
    values (v_sale_id, v_item.product_id, v_item.variant_id, v_item.quantity, v_item.unit_price_snapshot, 0, v_item.subtotal_snapshot);

    if v_item.variant_id is not null then
      update public.product_variants set stock = stock - v_item.quantity
      where id = v_item.variant_id and stock >= v_item.quantity;
    else
      update public.products set stock = stock - v_item.quantity
      where id = v_item.product_id and stock >= v_item.quantity;
    end if;

    if not found then
      raise exception 'insufficient stock for product % at conversion time', v_item.product_id;
    end if;

    insert into public.inventory_movements (product_id, variant_id, type, quantity, reason, sale_id, user_id)
    values (v_item.product_id, v_item.variant_id, 'venda', -v_item.quantity, 'venda confirmada (orçamento convertido)', v_sale_id, auth.uid());
  end loop;

  -- Pontos e comissão usam o valor final real da venda (frete + taxa
  -- incluídos), igual ao fluxo normal de confirm_sale.
  v_points := floor(v_orcamento.final_value)::integer;

  insert into public.points_transactions (customer_id, type, points, reason, sale_id, user_id)
  values (v_orcamento.customer_id, 'entrada', v_points, 'venda confirmada', v_sale_id, auth.uid());

  update public.customers
  set points = points + v_points, total_spent = total_spent + v_orcamento.final_value, last_purchase_at = now()
  where id = v_orcamento.customer_id;

  update public.sales
  set status = 'confirmada', confirmed_at = now(), points_generated = v_points
  where id = v_sale_id;

  select * into v_rule
  from public.commission_rules
  where status = 'ativa'
    and (period_start is null or period_start <= current_date)
    and (period_end is null or period_end >= current_date)
  order by created_at desc
  limit 1;

  if found then
    v_percentage_applied := v_rule.percentage;
    v_fixed_applied := v_rule.fixed_value;
    v_commission_amount := coalesce(v_orcamento.final_value * v_rule.percentage / 100, 0) + coalesce(v_rule.fixed_value, 0);

    -- seller_id da comissão é o do ORÇAMENTO (v_orcamento.seller_id), não
    -- de quem clicou em converter — preserva a atribuição correta mesmo
    -- quando o admin converte em nome de outro vendedor.
    insert into public.commissions (
      sale_id, seller_id, rule_id, sale_amount,
      percentage_applied, fixed_value_applied, commission_amount, status
    ) values (
      v_sale_id, v_orcamento.seller_id, v_rule.id, v_orcamento.final_value,
      v_percentage_applied, v_fixed_applied, v_commission_amount, 'pendente'
    );
  end if;

  update public.orcamentos set status = 'convertido', converted_sale_id = v_sale_id where id = p_orcamento_id;

  perform public.log_audit('orcamento_convertido', 'orcamentos', p_orcamento_id, jsonb_build_object('sale_id', v_sale_id));

  return v_sale_id;
end;
$$;

-- Assinatura não muda (continua recebendo só o uuid do orçamento), então
-- create or replace preserva os grants já existentes; reforçando aqui
-- mesmo assim por clareza e defesa em profundidade.
revoke all on function public.convert_orcamento_to_sale(uuid) from public;
grant execute on function public.convert_orcamento_to_sale(uuid) to authenticated;
