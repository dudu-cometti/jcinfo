-- ============================================================
-- CRÍTICO — integridade final do estoque.
--
-- Até aqui, `products_admin_write`/`product_variants_admin_write` (RLS
-- "for all" para admin) deixavam qualquer admin alterar `products.stock`/
-- `product_variants.stock` direto por uma chamada REST comum — nenhuma das
-- funções SECURITY DEFINER (adjust_stock, receive_stock,
-- reverse_stock_receipt, confirm_sale, reverse_sale,
-- convert_orcamento_to_sale) era a única via de fato, só a única via
-- "pela aplicação". Um PATCH direto em products/product_variants sempre
-- podia sobrescrever o estoque sem gerar nenhum inventory_movements,
-- quebrando a razão/auditoria.
--
-- A trava é um trigger BEFORE INSERT OR UPDATE em products e
-- product_variants:
--   - INSERT: sempre força stock = 0 (produto/variante novo nunca nasce
--     com estoque — a primeira quantidade só entra pelo fluxo de
--     "Entrada de estoque", com fornecedor/documento, ou motivo
--     "Estoque inicial").
--   - UPDATE: só permite mudar `stock` se a transação tiver marcado
--     `app.allow_stock_write = 'on'` via set_config(..., true) — uma
--     configuração de sessão com escopo de TRANSAÇÃO (some sozinha no
--     commit/rollback), que só as funções legítimas ligam antes de tocar
--     estoque. Uma chamada REST direta nunca liga essa flag, então nunca
--     passa pelo trigger.
--
-- inventory_movements_admin_manual_insert (000006) também é removida:
-- a partir de agora NENHUM insert em inventory_movements é permitido pela
-- API — só pelas funções SECURITY DEFINER, que gravam a tabela como o
-- owner (contornam RLS por padrão, exatamente como sales/commissions/
-- points_transactions já funcionam desde o início do projeto).
-- ============================================================

drop policy "inventory_movements_admin_manual_insert" on public.inventory_movements;

create or replace function public.guard_stock_column_write()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.stock := 0;
    return new;
  end if;

  if tg_op = 'UPDATE' and new.stock is distinct from old.stock then
    if coalesce(current_setting('app.allow_stock_write', true), '') <> 'on' then
      raise exception 'direct stock changes are not allowed; use a stock movement function' using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger guard_products_stock_write
  before insert or update on public.products
  for each row execute function public.guard_stock_column_write();

create trigger guard_product_variants_stock_write
  before insert or update on public.product_variants
  for each row execute function public.guard_stock_column_write();

-- --- Cada função legítima liga a flag da transação antes de tocar estoque ---

create or replace function public.sync_product_from_variants()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid := coalesce(new.product_id, old.product_id);
  v_has_variants boolean;
  v_min_price numeric(12, 2);
  v_min_promo numeric(12, 2);
  v_total_stock integer;
begin
  select exists(select 1 from public.product_variants where product_id = v_product_id) into v_has_variants;

  if v_has_variants then
    select
      min(price),
      min(promo_price) filter (where promo_price is not null),
      coalesce(sum(stock), 0)
    into v_min_price, v_min_promo, v_total_stock
    from public.product_variants
    where product_id = v_product_id and status = 'ativo';

    perform set_config('app.allow_stock_write', 'on', true);

    update public.products
    set
      price = coalesce(v_min_price, price),
      promo_price = case
        when v_min_promo is not null and v_min_promo < coalesce(v_min_price, price) then v_min_promo
        else null
      end,
      stock = coalesce(v_total_stock, 0)
    where id = v_product_id;
  end if;

  return null;
end;
$$;

create or replace function public.confirm_sale(p_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.sales%rowtype;
  v_item record;
  v_points integer;
  v_rule public.commission_rules%rowtype;
  v_percentage_applied numeric(5, 2);
  v_fixed_applied numeric(12, 2);
  v_commission_amount numeric(12, 2);
begin
  if not public.is_staff() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then
    raise exception 'sale % not found', p_sale_id;
  end if;
  if v_sale.status <> 'pendente' then
    raise exception 'sale % is not pendente (current status: %)', p_sale_id, v_sale.status;
  end if;

  perform set_config('app.allow_stock_write', 'on', true);

  for v_item in select * from public.sale_items where sale_id = p_sale_id
  loop
    if v_item.variant_id is not null then
      update public.product_variants
      set stock = stock - v_item.quantity
      where id = v_item.variant_id and stock >= v_item.quantity;
    else
      update public.products
      set stock = stock - v_item.quantity
      where id = v_item.product_id and stock >= v_item.quantity;
    end if;

    if not found then
      raise exception 'insufficient stock for product % at confirmation time', v_item.product_id;
    end if;

    insert into public.inventory_movements (product_id, variant_id, type, quantity, reason, sale_id, user_id)
    values (v_item.product_id, v_item.variant_id, 'venda', -v_item.quantity, 'venda confirmada', p_sale_id, auth.uid());
  end loop;

  v_points := floor(v_sale.total)::integer;

  insert into public.points_transactions (customer_id, type, points, reason, sale_id, user_id)
  values (v_sale.customer_id, 'entrada', v_points, 'venda confirmada', p_sale_id, auth.uid());

  update public.customers
  set
    points = points + v_points,
    total_spent = total_spent + v_sale.total,
    last_purchase_at = now()
  where id = v_sale.customer_id;

  update public.sales
  set status = 'confirmada', confirmed_at = now(), points_generated = v_points
  where id = p_sale_id;

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
    v_commission_amount := coalesce(v_sale.total * v_rule.percentage / 100, 0) + coalesce(v_rule.fixed_value, 0);

    insert into public.commissions (
      sale_id, seller_id, rule_id, sale_amount,
      percentage_applied, fixed_value_applied, commission_amount, status
    ) values (
      p_sale_id, v_sale.seller_id, v_rule.id, v_sale.total,
      v_percentage_applied, v_fixed_applied, v_commission_amount, 'pendente'
    );
  end if;

  perform public.log_audit('venda_confirmada', 'sales', p_sale_id, jsonb_build_object('points_generated', v_points));
end;
$$;

create or replace function public.reverse_sale(p_sale_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale public.sales%rowtype;
  v_item record;
begin
  if not public.is_admin() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'a reason is required to reverse a sale';
  end if;

  select * into v_sale from public.sales where id = p_sale_id for update;
  if not found then
    raise exception 'sale % not found', p_sale_id;
  end if;
  if v_sale.status not in ('confirmada', 'concluida') then
    raise exception 'only a confirmada/concluida sale can be estornada (current status: %)', v_sale.status;
  end if;

  perform set_config('app.allow_stock_write', 'on', true);

  for v_item in select * from public.sale_items where sale_id = p_sale_id
  loop
    if v_item.variant_id is not null then
      update public.product_variants set stock = stock + v_item.quantity where id = v_item.variant_id;
    else
      update public.products set stock = stock + v_item.quantity where id = v_item.product_id;
    end if;

    insert into public.inventory_movements (product_id, variant_id, type, quantity, reason, sale_id, user_id)
    values (v_item.product_id, v_item.variant_id, 'estorno', v_item.quantity, p_reason, p_sale_id, auth.uid());
  end loop;

  insert into public.points_transactions (customer_id, type, points, reason, sale_id, user_id)
  values (v_sale.customer_id, 'estorno', -v_sale.points_generated, p_reason, p_sale_id, auth.uid());

  update public.customers
  set
    points = greatest(0, points - v_sale.points_generated),
    total_spent = greatest(0, total_spent - v_sale.total)
  where id = v_sale.customer_id;

  update public.commissions set status = 'cancelada' where sale_id = p_sale_id;

  update public.sales set status = 'estornada' where id = p_sale_id;

  perform public.log_audit('venda_estornada', 'sales', p_sale_id, jsonb_build_object('reason', p_reason));
end;
$$;

create or replace function public.adjust_stock(
  p_product_id uuid,
  p_type public.inventory_movement_type,
  p_quantity integer,
  p_reason text,
  p_variant_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delta integer;
  v_variant_count integer;
begin
  if not public.is_admin() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if p_type not in ('entrada', 'saida', 'ajuste') then
    raise exception 'invalid manual movement type: %', p_type;
  end if;

  if p_quantity = 0 then
    raise exception 'quantity cannot be zero';
  end if;

  if p_type = 'saida' then
    if p_quantity < 0 then
      raise exception 'quantity must be positive for saida (it is subtracted automatically)';
    end if;
    v_delta := -p_quantity;
  elsif p_type = 'entrada' then
    if p_quantity < 0 then
      raise exception 'quantity must be positive for entrada';
    end if;
    v_delta := p_quantity;
  else
    v_delta := p_quantity;
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'a reason is required for a manual stock movement';
  end if;

  select count(*) into v_variant_count from public.product_variants where product_id = p_product_id;

  if v_variant_count > 0 and p_variant_id is null then
    raise exception 'this product has color variants; choose one to adjust';
  end if;

  perform set_config('app.allow_stock_write', 'on', true);

  if p_variant_id is not null then
    update public.product_variants
    set stock = stock + v_delta
    where id = p_variant_id and product_id = p_product_id and stock + v_delta >= 0;
  else
    update public.products
    set stock = stock + v_delta
    where id = p_product_id and stock + v_delta >= 0;
  end if;

  if not found then
    raise exception 'insufficient stock for this adjustment';
  end if;

  insert into public.inventory_movements (product_id, variant_id, type, quantity, reason, user_id)
  values (p_product_id, p_variant_id, p_type, v_delta, p_reason, auth.uid());

  perform public.log_audit(
    'estoque_ajustado',
    'products',
    p_product_id,
    jsonb_build_object('type', p_type, 'delta', v_delta, 'reason', p_reason, 'variant_id', p_variant_id)
  );
end;
$$;

create or replace function public.receive_stock(
  p_supplier_name text,
  p_items jsonb,
  p_document_number text default null,
  p_received_at date default current_date,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_receipt_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_variant_id uuid;
  v_quantity integer;
  v_unit_cost numeric(12, 2);
  v_variant_count integer;
begin
  if not public.is_admin() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if p_supplier_name is null or length(trim(p_supplier_name)) = 0 then
    raise exception 'supplier name is required';
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'receipt must have at least one item';
  end if;

  perform set_config('app.allow_stock_write', 'on', true);

  insert into public.stock_receipts (supplier_name, document_number, received_at, notes, created_by)
  values (p_supplier_name, p_document_number, p_received_at, p_notes, auth.uid())
  returning id into v_receipt_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item ->> 'product_id')::uuid;
    v_variant_id := nullif(v_item ->> 'variant_id', '')::uuid;
    v_quantity := (v_item ->> 'quantity')::integer;
    v_unit_cost := (v_item ->> 'unit_cost')::numeric;

    if v_quantity is null or v_quantity <= 0 then
      raise exception 'invalid quantity for item %', v_item;
    end if;
    if v_unit_cost is null or v_unit_cost < 0 then
      raise exception 'invalid unit cost for item %', v_item;
    end if;
    if not exists (select 1 from public.products where id = v_product_id) then
      raise exception 'product % not found', v_product_id;
    end if;

    select count(*) into v_variant_count from public.product_variants where product_id = v_product_id;

    if v_variant_count > 0 and v_variant_id is null then
      raise exception 'this product has color variants; choose one to receive';
    end if;
    if v_variant_count = 0 and v_variant_id is not null then
      raise exception 'product % has no color variants', v_product_id;
    end if;
    if v_variant_id is not null and not exists (
      select 1 from public.product_variants where id = v_variant_id and product_id = v_product_id
    ) then
      raise exception 'variant % does not belong to product %', v_variant_id, v_product_id;
    end if;

    insert into public.stock_receipt_items (receipt_id, product_id, variant_id, quantity, unit_cost)
    values (v_receipt_id, v_product_id, v_variant_id, v_quantity, v_unit_cost);

    if v_variant_id is not null then
      update public.product_variants set stock = stock + v_quantity where id = v_variant_id;
    else
      update public.products set stock = stock + v_quantity where id = v_product_id;
    end if;

    if not found then
      raise exception 'failed to update stock for item %', v_item;
    end if;

    insert into public.inventory_movements (product_id, variant_id, type, quantity, reason, user_id, receipt_id)
    values (v_product_id, v_variant_id, 'entrada', v_quantity,
      'Recebimento: ' || p_supplier_name || coalesce(' NF ' || p_document_number, ''), auth.uid(), v_receipt_id);
  end loop;

  perform public.log_audit(
    'estoque_recebido',
    'stock_receipts',
    v_receipt_id,
    jsonb_build_object('supplier_name', p_supplier_name, 'item_count', jsonb_array_length(p_items))
  );

  return v_receipt_id;
end;
$$;

create or replace function public.reverse_stock_receipt(p_receipt_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_receipt public.stock_receipts%rowtype;
  v_item record;
  v_current_stock integer;
begin
  if not public.is_admin() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'a reason is required to reverse a stock receipt';
  end if;

  select * into v_receipt from public.stock_receipts where id = p_receipt_id for update;
  if not found then
    raise exception 'stock receipt % not found', p_receipt_id;
  end if;
  if v_receipt.reversed_at is not null then
    raise exception 'stock receipt % has already been reversed', p_receipt_id;
  end if;

  for v_item in select * from public.stock_receipt_items where receipt_id = p_receipt_id
  loop
    if v_item.variant_id is not null then
      select stock into v_current_stock from public.product_variants where id = v_item.variant_id for update;
    else
      select stock into v_current_stock from public.products where id = v_item.product_id for update;
    end if;

    if v_current_stock is null or v_current_stock < v_item.quantity then
      raise exception 'reversing this receipt would leave negative stock for product %', v_item.product_id;
    end if;
  end loop;

  perform set_config('app.allow_stock_write', 'on', true);

  for v_item in select * from public.stock_receipt_items where receipt_id = p_receipt_id
  loop
    if v_item.variant_id is not null then
      update public.product_variants set stock = stock - v_item.quantity where id = v_item.variant_id;
    else
      update public.products set stock = stock - v_item.quantity where id = v_item.product_id;
    end if;

    insert into public.inventory_movements (product_id, variant_id, type, quantity, reason, user_id, receipt_id)
    values (v_item.product_id, v_item.variant_id, 'estorno', -v_item.quantity, p_reason, auth.uid(), p_receipt_id);
  end loop;

  update public.stock_receipts
  set reversed_at = now(), reversed_by = auth.uid(), reversal_reason = p_reason
  where id = p_receipt_id;

  perform public.log_audit('estoque_recebimento_estornado', 'stock_receipts', p_receipt_id, jsonb_build_object('reason', p_reason));
end;
$$;

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

  perform set_config('app.allow_stock_write', 'on', true);

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
