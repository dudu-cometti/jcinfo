-- ============================================================
-- Sale lifecycle as atomic SECURITY DEFINER functions.
--
-- These are the ONLY way sales, stock, points and commissions are allowed
-- to change together. Never trust price/points/commission/stock values sent
-- by the client — every number here is recomputed from `products` and
-- `commission_rules` inside the transaction (spec section 27).
--
-- Status machine: pendente -> confirmada -> concluida
--                          \-> cancelada (before confirmada: no side effects)
--                 confirmada/concluida -> estornada (reverses side effects)
--
-- Stock, points and commission are applied on the pendente -> confirmada
-- transition (confirm_sale). concluida is a downstream "fulfilled" marker
-- and does not re-apply them. estorno reverses whatever confirm_sale did.
-- ============================================================

create or replace function public.log_audit(
  p_action text,
  p_resource_table text,
  p_resource_id uuid,
  p_data jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (user_id, action, resource_table, resource_id, data)
  values (auth.uid(), p_action, p_resource_table, p_resource_id, p_data);
end;
$$;

-- p_items shape: [{"product_id": "<uuid>", "quantity": <int>}, ...]
create or replace function public.register_sale(
  p_customer_id uuid,
  p_items jsonb,
  p_discount numeric default 0,
  p_notes text default null,
  p_origin text default 'painel_vendedor'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.user_role;
  v_sale_id uuid;
  v_subtotal numeric(12, 2) := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_item_subtotal numeric(12, 2);
begin
  v_role := public.current_user_role();
  if v_role is null then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  if not exists (select 1 from public.customers where id = p_customer_id) then
    raise exception 'customer % not found', p_customer_id;
  end if;

  if jsonb_array_length(p_items) = 0 then
    raise exception 'sale must have at least one item';
  end if;

  if p_discount < 0 then
    raise exception 'discount cannot be negative';
  end if;

  insert into public.sales (customer_id, seller_id, status, subtotal, discount, total, origin, notes)
  values (p_customer_id, auth.uid(), 'pendente', 0, p_discount, 0, p_origin, p_notes)
  returning id into v_sale_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'invalid quantity for item %', v_item;
    end if;

    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::uuid
    for share;

    if not found then
      raise exception 'product % not found', v_item ->> 'product_id';
    end if;

    if v_product.status <> 'ativo' then
      raise exception 'product % is not active', v_product.name;
    end if;

    if v_product.stock < v_quantity then
      raise exception 'insufficient stock for product %: available %, requested %',
        v_product.name, v_product.stock, v_quantity;
    end if;

    v_item_subtotal := coalesce(v_product.promo_price, v_product.price) * v_quantity;
    v_subtotal := v_subtotal + v_item_subtotal;

    insert into public.sale_items (sale_id, product_id, quantity, unit_price, discount, subtotal)
    values (
      v_sale_id,
      v_product.id,
      v_quantity,
      coalesce(v_product.promo_price, v_product.price),
      0,
      v_item_subtotal
    );
  end loop;

  if p_discount > v_subtotal then
    raise exception 'discount (%) cannot exceed subtotal (%)', p_discount, v_subtotal;
  end if;

  update public.sales
  set subtotal = v_subtotal, total = v_subtotal - p_discount
  where id = v_sale_id;

  perform public.log_audit('venda_criada', 'sales', v_sale_id, jsonb_build_object('total', v_subtotal - p_discount));

  return v_sale_id;
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

  for v_item in select * from public.sale_items where sale_id = p_sale_id
  loop
    update public.products
    set stock = stock - v_item.quantity
    where id = v_item.product_id and stock >= v_item.quantity;

    if not found then
      raise exception 'insufficient stock for product % at confirmation time', v_item.product_id;
    end if;

    insert into public.inventory_movements (product_id, type, quantity, reason, sale_id, user_id)
    values (v_item.product_id, 'venda', -v_item.quantity, 'venda confirmada', p_sale_id, auth.uid());
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

create or replace function public.cancel_sale(p_sale_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.sale_status;
begin
  if not public.is_staff() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select status into v_status from public.sales where id = p_sale_id for update;
  if not found then
    raise exception 'sale % not found', p_sale_id;
  end if;
  if v_status <> 'pendente' then
    raise exception 'only a pendente sale can be cancelled directly; use estornar for a confirmed/concluded sale';
  end if;

  update public.sales
  set
    status = 'cancelada',
    cancelled_at = now(),
    notes = trim(both ' | ' from coalesce(notes, '') || ' | ' || coalesce(p_reason, ''))
  where id = p_sale_id;

  perform public.log_audit('venda_cancelada', 'sales', p_sale_id, jsonb_build_object('reason', p_reason));
end;
$$;

create or replace function public.complete_sale(p_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.sale_status;
begin
  if not public.is_staff() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  select status into v_status from public.sales where id = p_sale_id for update;
  if not found then
    raise exception 'sale % not found', p_sale_id;
  end if;
  if v_status <> 'confirmada' then
    raise exception 'sale % must be confirmada before it can be concluida', p_sale_id;
  end if;

  update public.sales set status = 'concluida' where id = p_sale_id;

  perform public.log_audit('venda_concluida', 'sales', p_sale_id, null);
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

  for v_item in select * from public.sale_items where sale_id = p_sale_id
  loop
    update public.products set stock = stock + v_item.quantity where id = v_item.product_id;

    insert into public.inventory_movements (product_id, type, quantity, reason, sale_id, user_id)
    values (v_item.product_id, 'estorno', v_item.quantity, p_reason, p_sale_id, auth.uid());
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

grant execute on function public.register_sale(uuid, jsonb, numeric, text, text) to authenticated;
grant execute on function public.confirm_sale(uuid) to authenticated;
grant execute on function public.cancel_sale(uuid, text) to authenticated;
grant execute on function public.complete_sale(uuid) to authenticated;
grant execute on function public.reverse_sale(uuid, text) to authenticated;
