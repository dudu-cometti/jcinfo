-- ============================================================
-- Converts an orçamento into a real sale. Takes ONLY the orçamento id —
-- nothing price/fee/stock-related is ever accepted from the caller, so
-- nothing "from the browser" can influence the amount actually charged.
-- Re-verifies stock and product/variant active status against LIVE rows
-- (not the orçamento's snapshot) before doing anything, and wraps the
-- existing register_sale()/confirm_sale() UNCHANGED — their signatures and
-- grants are untouched, so this cannot regress the current sale flow.
--
-- The orçamento's own fee snapshot (percentage_applied/fixed_value_applied/
-- final_value) IS reused rather than re-derived from payment_rate_rules at
-- conversion time: that snapshot is the price the customer was quoted and
-- approved, and honoring it is the point of a quote. Only availability/
-- product-status are re-checked live, and only the orçamento id comes from
-- the client — the fee itself was already computed server-side when the
-- orçamento was created (never trusted from the browser then either).
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
  v_items jsonb := '[]'::jsonb;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_available integer;
  v_sale_id uuid;
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

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_item.product_id,
      'variant_id', v_item.variant_id,
      'quantity', v_item.quantity
    ));
  end loop;

  -- register_sale recomputes item price/subtotal from the CURRENT
  -- products/product_variants rows itself (never from orcamento_items'
  -- snapshot price) — this is the "recalcular tudo no banco" the spec
  -- requires. p_discount is the orçamento's flat item-level discount.
  v_sale_id := public.register_sale(
    v_orcamento.customer_id,
    v_items,
    v_orcamento.discount,
    v_orcamento.notes,
    'orcamento_convertido'
  );

  -- Stamp freight/machine/installment metadata and the customer-facing
  -- total. `total` must be the orçamento's quoted final_value (base value
  -- plus freight plus the card-machine fee markup, per
  -- valor_cobrado = (valor_base + taxa_fixa) / (1 - taxa_percentual/100)),
  -- not merely subtotal-discount+freight — the fee the customer agreed to
  -- pay is part of what they're charged.
  update public.sales
  set
    orcamento_id = p_orcamento_id,
    freight_value = v_orcamento.freight_value,
    machine_id = v_orcamento.machine_id,
    payment_method = v_orcamento.payment_method,
    installments = v_orcamento.installments,
    percentage_applied = v_orcamento.percentage_applied,
    fixed_value_applied = v_orcamento.fixed_value_applied,
    total = v_orcamento.final_value
  where id = v_sale_id;

  -- confirm_sale reads sales.total fresh (SELECT ... FOR UPDATE after the
  -- update above), so points/commission are computed on the freight+fee
  -- inclusive total the customer actually pays.
  perform public.confirm_sale(v_sale_id);

  update public.orcamentos
  set status = 'convertido', converted_sale_id = v_sale_id
  where id = p_orcamento_id;

  perform public.log_audit(
    'orcamento_convertido',
    'orcamentos',
    p_orcamento_id,
    jsonb_build_object('sale_id', v_sale_id)
  );

  return v_sale_id;
end;
$$;

revoke all on function public.convert_orcamento_to_sale(uuid) from public;
grant execute on function public.convert_orcamento_to_sale(uuid) to authenticated;
