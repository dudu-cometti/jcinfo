-- ============================================================
-- CRÍTICO: fecha a integridade financeira do orçamento.
--
-- Até aqui, `orcamentos_seller_insert_own`/`orcamentos_seller_update_own`/
-- `orcamento_items_seller_write_own` (migration 000038) permitiam ao
-- vendedor inserir/alterar essas tabelas diretamente pela API do Supabase
-- — ou seja, qualquer chamada REST direta (fora do Server Action) podia
-- gravar subtotal/desconto/frete/taxa/total/parcelas/seller_id/status
-- arbitrários. A partir desta migration, a única forma de criar ou alterar
-- um orçamento é através das funções SECURITY DEFINER da migration 000044
-- (create_orcamento/send_orcamento/approve_orcamento/cancel_orcamento),
-- que recalculam tudo a partir de dados confiáveis do banco.
--
-- `orcamentos_admin_all`/`orcamento_items_admin_all` (also for all) ficam
-- como estão, para correções administrativas pontuais — o pedido do
-- usuário é especificamente sobre o vendedor não conseguir adulterar
-- valores, não sobre remover a via de correção do admin.
-- ============================================================

drop policy "orcamentos_seller_insert_own" on public.orcamentos;
drop policy "orcamentos_seller_update_own" on public.orcamentos;
drop policy "orcamento_items_seller_write_own" on public.orcamento_items;

-- card_brand snapshot: falta para o item "taxas por bandeira" — a bandeira
-- efetivamente usada no cálculo precisa ficar registrada no orçamento (e,
-- na conversão, na venda) para auditoria/histórico.
alter table public.orcamentos add column card_brand_snapshot text;
alter table public.sales add column card_brand_applied text;
