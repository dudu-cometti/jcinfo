-- ============================================================
-- CRÍTICO — corrige dois furos que sobraram da migration 000047:
--
-- 1) products_public_v tinha sido recriada SEM security_invoker: nas
--    views do Postgres, quando security_invoker não está ligado, tanto as
--    checagens de GRANT quanto a própria Row Level Security da tabela de
--    base são avaliadas com a identidade do OWNER da view, não de quem
--    está de fato consultando. Isso significa que products_public_v podia
--    devolver produtos inativos (e qualquer linha) para anon/authenticated
--    independentemente da policy products_public_select_active, porque a
--    RLS estava sendo avaliada como o owner (que nem sequer é anon), não
--    como o visitante real. Com security_invoker = true, tanto o GRANT
--    quanto a RLS voltam a ser avaliados com a identidade de quem chamou —
--    e isso só funciona sem quebrar nada porque 000047 já concede a
--    anon/authenticated exatamente as colunas que esta view seleciona.
--
-- 2) 000047 já tinha revogado o SELECT antigo da tabela toda e concedido
--    de volta só as colunas seguras — mas nunca existiu um REVOKE
--    explícito e nomeado especificamente para cost/internal_code. Este
--    REVOKE não muda o comportamento (o GRANT de 000047 já não inclui
--    essas colunas), mas deixa a intenção de segurança explícita no
--    schema, sem depender só da ausência de um GRANT.
--
-- 3) create_orcamento nunca checava products.status/product_variants.status
--    — um produto ou variante desativado depois de cadastrado podia
--    entrar num orçamento novo normalmente.
-- ============================================================

drop view public.products_public_v;

create view public.products_public_v
  with (security_invoker = true) as
select
  id, name, slug, description, category_id, brand_id, model, condition,
  price, promo_price, stock, min_stock, sku, status, featured, created_at, updated_at
from public.products;

grant select on public.products_public_v to anon, authenticated;

revoke select (cost, internal_code) on public.products from anon, authenticated;

-- --- create_orcamento: rejeita produto/variante inativos ---

create or replace function public.create_orcamento(
  p_customer_id uuid,
  p_items jsonb,
  p_discount numeric default 0,
  p_freight_value numeric default 0,
  p_machine_id uuid default null,
  p_payment_method public.payment_method default 'pix',
  p_card_brand text default null,
  p_installments integer default 1,
  p_validity_days integer default 3,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer public.customers%rowtype;
  v_machine public.payment_machines%rowtype;
  v_rule public.payment_rate_rules%rowtype;
  v_orcamento_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_variant_id uuid;
  v_variant_count integer;
  v_quantity integer;
  v_unit_price numeric(12, 2);
  v_available integer;
  v_image_url text;
  v_subtotal numeric(12, 2) := 0;
  v_item_subtotal numeric(12, 2);
  v_base numeric(12, 2);
  v_final numeric(12, 2);
  v_installments integer;
  v_installment_value numeric(12, 2);
  v_last_installment numeric(12, 2);
  v_percentage numeric(5, 2) := 0;
  v_fixed numeric(12, 2) := 0;
  v_freight_max numeric(12, 2);
  v_position integer := 0;
begin
  if not public.is_staff() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'orcamento must have at least one item';
  end if;
  if p_discount < 0 then
    raise exception 'discount cannot be negative';
  end if;
  if p_freight_value < 0 then
    raise exception 'freight cannot be negative';
  end if;

  select (value #>> '{}')::numeric into v_freight_max
  from public.site_settings where key = 'freight_max_value';
  if v_freight_max is not null and p_freight_value > v_freight_max then
    raise exception 'freight value exceeds the configured maximum';
  end if;

  select * into v_customer from public.customers where id = p_customer_id;
  if not found then
    raise exception 'customer % not found', p_customer_id;
  end if;

  select * into v_machine from public.payment_machines where id = p_machine_id and status = 'ativo';
  if not found then
    raise exception 'machine invalid or inactive';
  end if;

  v_installments := case when p_payment_method = 'credito' then greatest(1, p_installments) else 1 end;

  if p_payment_method = 'credito' and (v_installments < v_machine.min_installments or v_installments > v_machine.max_installments) then
    raise exception 'this machine only accepts % to %x', v_machine.min_installments, v_machine.max_installments;
  end if;

  -- rascunho inicial (sem valores financeiros ainda) para já ter um id
  -- para os itens; os campos monetários são preenchidos só ao final,
  -- depois de calculados, num único UPDATE.
  insert into public.orcamentos (seller_id, customer_id, customer_name_snapshot, status, validity_days, notes)
  values (auth.uid(), p_customer_id, v_customer.name, 'rascunho', greatest(1, p_validity_days), p_notes)
  returning id into v_orcamento_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'invalid quantity for item %', v_item;
    end if;

    select * into v_product from public.products where id = (v_item ->> 'product_id')::uuid;
    if not found then
      raise exception 'product % not found', v_item ->> 'product_id';
    end if;
    if v_product.status <> 'ativo' then
      raise exception 'product % is not active', v_product.name;
    end if;

    v_variant_id := nullif(v_item ->> 'variant_id', '')::uuid;
    select count(*) into v_variant_count from public.product_variants where product_id = v_product.id;

    if v_variant_count > 0 and v_variant_id is null then
      raise exception 'select a color for product %', v_product.name;
    end if;
    if v_variant_count = 0 and v_variant_id is not null then
      raise exception 'product % has no color variants', v_product.name;
    end if;

    if v_variant_id is not null then
      select * into v_variant from public.product_variants where id = v_variant_id and product_id = v_product.id;
      if not found then
        raise exception 'variant % does not belong to product %', v_variant_id, v_product.id;
      end if;
      if v_variant.status <> 'ativo' then
        raise exception 'variant % of product % is not active', v_variant.color_name, v_product.name;
      end if;
      v_unit_price := coalesce(v_variant.promo_price, v_variant.price);
      v_available := v_variant.stock;
    else
      v_unit_price := coalesce(v_product.promo_price, v_product.price);
      v_available := v_product.stock;
    end if;

    select pi.url into v_image_url
    from public.product_images pi
    where pi.product_id = v_product.id and (pi.variant_id = v_variant_id or pi.variant_id is null)
    order by (pi.variant_id is not null) desc, pi.position
    limit 1;

    v_item_subtotal := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_item_subtotal;

    insert into public.orcamento_items (
      orcamento_id, product_id, variant_id, product_name_snapshot, variant_color_snapshot,
      image_url_snapshot, unit_price_snapshot, quantity, subtotal_snapshot, stock_available_at_creation, position
    ) values (
      v_orcamento_id, v_product.id, v_variant_id, v_product.name, v_variant.color_name,
      v_image_url, v_unit_price, v_quantity, v_item_subtotal, v_available, v_position
    );

    v_position := v_position + 1;
  end loop;

  if p_discount > v_subtotal then
    raise exception 'discount (%) cannot exceed subtotal (%)', p_discount, v_subtotal;
  end if;

  v_base := v_subtotal - p_discount + p_freight_value;

  if p_payment_method in ('pix', 'dinheiro') then
    v_final := v_base;
    v_installments := 1;
    v_percentage := 0;
    v_fixed := 0;
  else
    -- Resolve a regra: prioriza bandeira exata; só cai para a regra
    -- "qualquer bandeira" (card_brand is null) como fallback explícito
    -- quando não há regra específica para a bandeira informada, ou quando
    -- nenhuma bandeira foi informada. Nunca pega a primeira regra que
    -- bater; a ordenação garante a bandeira específica primeiro.
    select * into v_rule
    from public.payment_rate_rules
    where machine_id = p_machine_id
      and method = p_payment_method
      and installments = v_installments
      and status = 'ativa'
      and (period_start is null or period_start <= current_date)
      and (period_end is null or period_end >= current_date)
      and (
        (p_card_brand is not null and (card_brand = p_card_brand or card_brand is null))
        or (p_card_brand is null and card_brand is null)
      )
    order by (card_brand is not null) desc, created_at desc
    limit 1;

    if not found then
      raise exception 'no active rate rule for this machine/method/installments/brand';
    end if;

    v_percentage := v_rule.percentage;
    v_fixed := coalesce(v_rule.fixed_value, 0);
    v_final := round((v_base + v_fixed) / (1 - v_percentage / 100), 2);
  end if;

  v_installment_value := floor(v_final / v_installments * 100) / 100;
  v_last_installment := v_final - v_installment_value * (v_installments - 1);

  update public.orcamentos
  set
    subtotal = v_subtotal,
    discount = p_discount,
    freight_value = p_freight_value,
    base_value = v_base,
    machine_id = v_machine.id,
    machine_name_snapshot = v_machine.name,
    rate_rule_id = v_rule.id,
    card_brand_snapshot = case when p_payment_method in ('debito', 'credito') then p_card_brand else null end,
    payment_method = p_payment_method,
    installments = v_installments,
    percentage_applied = v_percentage,
    fixed_value_applied = v_fixed,
    rate_period_start = v_rule.period_start,
    rate_period_end = v_rule.period_end,
    final_value = v_final,
    installment_value = v_installment_value,
    last_installment_value = v_last_installment,
    expires_at = now() + (greatest(1, p_validity_days) || ' days')::interval
  where id = v_orcamento_id;

  perform public.log_audit('orcamento_criado', 'orcamentos', v_orcamento_id, jsonb_build_object('final_value', v_final));

  return v_orcamento_id;
end;
$$;

revoke all on function public.create_orcamento(uuid, jsonb, numeric, numeric, uuid, public.payment_method, text, integer, integer, text) from public;
grant execute on function public.create_orcamento(uuid, jsonb, numeric, numeric, uuid, public.payment_method, text, integer, integer, text) to authenticated;
