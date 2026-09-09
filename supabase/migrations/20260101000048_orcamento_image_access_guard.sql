-- ============================================================
-- A imagem pública do orçamento só pode existir se: o token não estiver
-- revogado, o orçamento estiver em 'enviado' ou 'aprovado', e não tiver
-- expirado. Antes, get_orcamento_snapshot_by_token só checava o token —
-- um orçamento cancelado, convertido ou expirado continuava gerando
-- imagem enquanto o token existisse. Mesma assinatura, então
-- create or replace é seguro.
-- ============================================================

create or replace function public.get_orcamento_snapshot_by_token(p_token text)
returns table (
  orcamento_id uuid,
  customer_name_snapshot text,
  created_at timestamptz,
  expires_at timestamptz,
  status public.orcamento_status,
  subtotal numeric,
  discount numeric,
  freight_value numeric,
  final_value numeric,
  machine_name_snapshot text,
  payment_method public.payment_method,
  installments integer,
  installment_value numeric,
  last_installment_value numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select o.id, o.customer_name_snapshot, o.created_at, o.expires_at, o.status,
           o.subtotal, o.discount, o.freight_value, o.final_value,
           o.machine_name_snapshot, o.payment_method,
           o.installments, o.installment_value, o.last_installment_value
    from public.orcamentos o
    join public.orcamento_share_tokens t on t.orcamento_id = o.id
    where t.token = p_token
      and t.revoked = false
      and o.status in ('enviado', 'aprovado')
      and (o.expires_at is null or o.expires_at > now());
end;
$$;

revoke all on function public.get_orcamento_snapshot_by_token(text) from public;
grant execute on function public.get_orcamento_snapshot_by_token(text) to anon, authenticated;

create or replace function public.get_orcamento_items_by_token(p_token text)
returns table (
  product_name_snapshot text,
  variant_color_snapshot text,
  image_url_snapshot text,
  unit_price_snapshot numeric,
  quantity integer,
  subtotal_snapshot numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select i.product_name_snapshot, i.variant_color_snapshot, i.image_url_snapshot,
           i.unit_price_snapshot, i.quantity, i.subtotal_snapshot
    from public.orcamento_items i
    join public.orcamento_share_tokens t on t.orcamento_id = i.orcamento_id
    join public.orcamentos o on o.id = i.orcamento_id
    where t.token = p_token
      and t.revoked = false
      and o.status in ('enviado', 'aprovado')
      and (o.expires_at is null or o.expires_at > now())
    order by i.position;
end;
$$;

revoke all on function public.get_orcamento_items_by_token(text) from public;
grant execute on function public.get_orcamento_items_by_token(text) to anon, authenticated;
