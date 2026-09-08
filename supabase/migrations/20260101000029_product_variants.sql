-- ============================================================
-- Color variants for "novo" products: each color has its own stock,
-- price/promo_price and photos. "seminovo" products are unaffected and
-- keep working exactly as before (single stock/price on `products`,
-- images with variant_id null).
--
-- products.price/promo_price/stock stay the single source of truth read
-- by every existing listing/report/JSON-LD/sitemap query in the app —
-- for a variant product they become a maintained aggregate (min price
-- across active variants, sum of stock) via a trigger, so none of that
-- existing code needs to change. Only the sale/stock-adjustment
-- functions and the admin/public UIs need to become variant-aware.
-- ============================================================

create type public.product_condition as enum ('novo', 'seminovo');

alter table public.products add column condition public.product_condition not null default 'seminovo';

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  color_name text not null,
  color_hex text,
  price numeric(12, 2) not null check (price >= 0),
  promo_price numeric(12, 2) check (promo_price is null or promo_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  sku text,
  position integer not null default 0,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_promo_lower_than_price check (promo_price is null or promo_price < price)
);

create index product_variants_product_id_idx on public.product_variants (product_id);

create trigger set_product_variants_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

alter table public.product_images add column variant_id uuid references public.product_variants (id) on delete cascade;
create index product_images_variant_id_idx on public.product_images (variant_id);

alter table public.sale_items add column variant_id uuid references public.product_variants (id) on delete restrict;
alter table public.inventory_movements add column variant_id uuid references public.product_variants (id) on delete set null;

-- --- RLS ---

alter table public.product_variants enable row level security;

create policy "product_variants_public_select" on public.product_variants
  for select to anon, authenticated using (true);
create policy "product_variants_admin_write" on public.product_variants
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- --- Keep products.price/promo_price/stock in sync with active variants ---

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

create trigger sync_product_from_variants_trg
  after insert or update or delete on public.product_variants
  for each row execute function public.sync_product_from_variants();

-- --- Variant-aware sale/stock functions (full bodies replaced) ---

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
  v_variant public.product_variants%rowtype;
  v_variant_id uuid;
  v_variant_count integer;
  v_quantity integer;
  v_item_subtotal numeric(12, 2);
  v_unit_price numeric(12, 2);
  v_available integer;
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

    v_variant_id := nullif(v_item ->> 'variant_id', '')::uuid;

    select count(*) into v_variant_count from public.product_variants where product_id = v_product.id;

    if v_variant_count > 0 and v_variant_id is null then
      raise exception 'select a color for product %', v_product.name;
    end if;

    if v_variant_id is not null then
      select * into v_variant
      from public.product_variants
      where id = v_variant_id and product_id = v_product.id
      for share;

      if not found then
        raise exception 'variant % not found for product %', v_variant_id, v_product.name;
      end if;

      if v_variant.status <> 'ativo' then
        raise exception 'variant % of product % is not active', v_variant.color_name, v_product.name;
      end if;

      v_available := v_variant.stock;
      v_unit_price := coalesce(v_variant.promo_price, v_variant.price);
    else
      v_available := v_product.stock;
      v_unit_price := coalesce(v_product.promo_price, v_product.price);
    end if;

    if v_available < v_quantity then
      raise exception 'insufficient stock for product %: available %, requested %',
        v_product.name, v_available, v_quantity;
    end if;

    v_item_subtotal := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_item_subtotal;

    insert into public.sale_items (sale_id, product_id, variant_id, quantity, unit_price, discount, subtotal)
    values (v_sale_id, v_product.id, v_variant_id, v_quantity, v_unit_price, 0, v_item_subtotal);
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

-- adjust_stock gains a new p_variant_id parameter, which changes its signature
-- (Postgres identifies functions by name + parameter types), so the old
-- 4-argument version must be dropped explicitly or it would coexist as a
-- separate overload instead of being replaced.
drop function if exists public.adjust_stock(uuid, public.inventory_movement_type, integer, text);

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

grant execute on function public.adjust_stock(uuid, public.inventory_movement_type, integer, text, uuid) to authenticated;
