-- ============================================================
-- Manual stock adjustments (entrada/saida/ajuste), atomic like the sale
-- functions in migration 000011: product stock and the inventory_movements
-- ledger must always change together (spec sections 14/27).
-- ============================================================

create or replace function public.adjust_stock(
  p_product_id uuid,
  p_type public.inventory_movement_type,
  p_quantity integer,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delta integer;
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
    -- ajuste: signed correction entered directly by the admin
    v_delta := p_quantity;
  end if;

  if p_reason is null or length(trim(p_reason)) = 0 then
    raise exception 'a reason is required for a manual stock movement';
  end if;

  update public.products
  set stock = stock + v_delta
  where id = p_product_id and stock + v_delta >= 0;

  if not found then
    raise exception 'insufficient stock for this adjustment';
  end if;

  insert into public.inventory_movements (product_id, type, quantity, reason, user_id)
  values (p_product_id, p_type, v_delta, p_reason, auth.uid());

  perform public.log_audit(
    'estoque_ajustado',
    'products',
    p_product_id,
    jsonb_build_object('type', p_type, 'delta', v_delta, 'reason', p_reason)
  );
end;
$$;

grant execute on function public.adjust_stock(uuid, public.inventory_movement_type, integer, text) to authenticated;
