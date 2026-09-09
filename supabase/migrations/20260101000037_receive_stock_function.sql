-- ============================================================
-- Atomic stock receipt: header + items + inventory_movements('entrada')
-- all written in one transaction. New function (not an overload of
-- adjust_stock): adjust_stock is single-item/single-reason and has no
-- header/supplier/document concept; overloading it would force its one
-- existing caller (registerStockAdjustment) to pass dummy header fields
-- and would change its meaning for an ad-hoc single correction. A new
-- function name avoids touching adjust_stock's signature/grant at all.
-- ============================================================

-- p_items shape: [{"product_id": "<uuid>", "variant_id": "<uuid>|null", "quantity": <int>, "unit_cost": <numeric>}, ...]
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

    insert into public.stock_receipt_items (receipt_id, product_id, variant_id, quantity, unit_cost)
    values (v_receipt_id, v_product_id, v_variant_id, v_quantity, v_unit_cost);

    if v_variant_id is not null then
      update public.product_variants set stock = stock + v_quantity where id = v_variant_id;
    else
      update public.products set stock = stock + v_quantity where id = v_product_id;
    end if;

    insert into public.inventory_movements (product_id, variant_id, type, quantity, reason, user_id)
    values (
      v_product_id,
      v_variant_id,
      'entrada',
      v_quantity,
      'Recebimento: ' || p_supplier_name || coalesce(' NF ' || p_document_number, ''),
      auth.uid()
    );
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

revoke all on function public.receive_stock(text, jsonb, text, date, text) from public;
grant execute on function public.receive_stock(text, jsonb, text, date, text) to authenticated;
