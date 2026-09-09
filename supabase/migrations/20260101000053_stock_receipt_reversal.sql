-- ============================================================
-- stock_receipts/stock_receipt_items tinham policies "for all" para
-- admin — ou seja, dava para editar ou apagar uma entrada já confirmada
-- direto pela API, sem deixar rastro. Isso é substituído por policies
-- só de select/insert (nunca update/delete: RLS nega por padrão o que não
-- tem policy). A correção de uma entrada errada passa a ser feita por
-- "Estornar entrada" — uma movimentação nova, negativa, com motivo
-- obrigatório e referência à entrada original — nunca um apagamento.
-- ============================================================

drop policy "stock_receipts_admin_all" on public.stock_receipts;
create policy "stock_receipts_admin_select" on public.stock_receipts
  for select to authenticated using (public.is_admin());
create policy "stock_receipts_admin_insert" on public.stock_receipts
  for insert to authenticated with check (public.is_admin());

drop policy "stock_receipt_items_admin_all" on public.stock_receipt_items;
create policy "stock_receipt_items_admin_select" on public.stock_receipt_items
  for select to authenticated
  using (exists (select 1 from public.stock_receipts r where r.id = stock_receipt_items.receipt_id and public.is_admin()));
create policy "stock_receipt_items_admin_insert" on public.stock_receipt_items
  for insert to authenticated
  with check (exists (select 1 from public.stock_receipts r where r.id = stock_receipt_items.receipt_id and public.is_admin()));

alter table public.stock_receipts add column reversed_at timestamptz;
alter table public.stock_receipts add column reversed_by uuid references public.profiles (id) on delete set null;
alter table public.stock_receipts add column reversal_reason text;

alter table public.inventory_movements add column receipt_id uuid references public.stock_receipts (id) on delete set null;
create index inventory_movements_receipt_id_idx on public.inventory_movements (receipt_id);

-- receive_stock passa a gravar receipt_id no próprio inventory_movements
-- de entrada (mesma assinatura, create or replace é seguro).
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

revoke all on function public.receive_stock(text, jsonb, text, date, text) from public;
grant execute on function public.receive_stock(text, jsonb, text, date, text) to authenticated;

-- --- Estorno de entrada: movimentação negativa nova, nunca um apagamento ---

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

  -- Primeiro valida TODOS os itens (nenhum pode deixar estoque negativo);
  -- só depois aplica qualquer mudança — tudo ou nada.
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

revoke all on function public.reverse_stock_receipt(uuid, text) from public;
grant execute on function public.reverse_stock_receipt(uuid, text) to authenticated;
