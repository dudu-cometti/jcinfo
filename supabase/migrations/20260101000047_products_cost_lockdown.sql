-- ============================================================
-- CRÍTICO: fecha de vez a exposição de products.cost/internal_code.
--
-- 000016/000023/000024 tentaram REVOKE de coluna em cima de um GRANT de
-- tabela ainda em vigor — e um REVOKE de coluna nunca sobrepõe um GRANT de
-- tabela já concedido, então cost continuava selecionável por qualquer
-- authenticated (inclusive vendedor e customer, que são o mesmo papel do
-- Postgres). A view products_public_v (000031) resolvia isso só para o
-- código da aplicação que passasse a usá-la — não para uma chamada REST
-- direta com a chave anon/authenticated.
--
-- Esta migration começa do zero: revoga TODO select da tabela base para
-- anon/authenticated e concede de volta só as colunas seguras. Sem nenhum
-- GRANT de tabela concorrente, o GRANT de coluna passa a ser realmente a
-- única via — cost e internal_code ficam de fato inacessíveis, para
-- qualquer papel, por qualquer caminho (aplicação ou REST direto).
--
-- Efeito colateral conhecido (mesmo já documentado nas migrations
-- anteriores): COUNT(*)/embeds tipo `products(count)` e `{count: 'exact'}`
-- exigem um GRANT de tabela sem qualificação, que não existe mais para
-- anon/authenticated. Os poucos pontos do admin que dependiam disso
-- (listagem paginada de produtos, contagem por categoria/marca, edição
-- completa do produto) passam a usar as funções SECURITY DEFINER abaixo,
-- que não dependem de GRANT nenhum do chamador.
-- ============================================================

revoke select on public.products from anon, authenticated;

grant select (
  id, name, slug, description, category_id, brand_id, model, condition,
  price, promo_price, stock, min_stock, sku, status, featured, created_at, updated_at
) on public.products to anon, authenticated;

-- products_public_v perde internal_code (nunca devia ter sido público) e
-- deixa de ser security_invoker: object grants passam a valer pelo
-- OWNER da view (não afetado pelo revoke acima), enquanto o
-- row_security continua avaliado pelo papel que está de fato consultando
-- — GRANT/coluna e RLS são mecanismos independentes no Postgres, então
-- isso não reabre a visibilidade de linha que products_public_select_active/
-- products_staff_select_all já controlam.
drop view public.products_public_v;

create view public.products_public_v as
select
  id, name, slug, description, category_id, brand_id, model, condition,
  price, promo_price, stock, min_stock, sku, status, featured, created_at, updated_at
from public.products;

grant select on public.products_public_v to anon, authenticated;

-- --- leitura administrativa completa (inclui cost/internal_code) ---

create or replace function public.admin_get_product(p_id uuid)
returns setof public.products
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  return query select * from public.products where id = p_id;
end;
$$;

revoke all on function public.admin_get_product(uuid) from public;
grant execute on function public.admin_get_product(uuid) to authenticated;

-- --- listagem paginada do admin (com busca/filtro/contagem) ---

create or replace function public.admin_list_products(
  p_search text default null,
  p_status public.product_status default null,
  p_brand_id uuid default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  name text,
  slug text,
  sku text,
  price numeric,
  promo_price numeric,
  stock integer,
  min_stock integer,
  status public.product_status,
  featured boolean,
  category_name text,
  brand_name text,
  total_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;

  return query
    select
      p.id, p.name, p.slug, p.sku, p.price, p.promo_price, p.stock, p.min_stock,
      p.status, p.featured, c.name, b.name,
      count(*) over () as total_count
    from public.products p
    left join public.categories c on c.id = p.category_id
    left join public.brands b on b.id = p.brand_id
    where
      (p_search is null or p_search = '' or p.name ilike '%' || p_search || '%'
        or p.sku ilike '%' || p_search || '%' or p.model ilike '%' || p_search || '%'
        or p.internal_code ilike '%' || p_search || '%')
      and (p_status is null or p.status = p_status)
      and (p_brand_id is null or p.brand_id = p_brand_id)
    order by p.created_at desc
    limit p_limit offset p_offset;
end;
$$;

revoke all on function public.admin_list_products(text, public.product_status, uuid, integer, integer) from public;
grant execute on function public.admin_list_products(text, public.product_status, uuid, integer, integer) to authenticated;

-- --- contagens usadas por /admin/categorias e /admin/marcas ---

create or replace function public.admin_category_product_counts()
returns table (category_id uuid, product_count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  return query
    select p.category_id, count(*) from public.products p
    where p.category_id is not null
    group by p.category_id;
end;
$$;

revoke all on function public.admin_category_product_counts() from public;
grant execute on function public.admin_category_product_counts() to authenticated;

create or replace function public.admin_brand_product_counts()
returns table (brand_id uuid, product_count bigint)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'unauthorized' using errcode = '42501';
  end if;
  return query
    select p.brand_id, count(*) from public.products p
    where p.brand_id is not null
    group by p.brand_id;
end;
$$;

revoke all on function public.admin_brand_product_counts() from public;
grant execute on function public.admin_brand_product_counts() to authenticated;
