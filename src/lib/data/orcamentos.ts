import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { SessionUser } from '@/lib/auth/dal'

const LIST_COLUMNS =
  'id, customer_name_snapshot, status, final_value, installments, payment_method, machine_name_snapshot, expires_at, created_at, seller_id, converted_sale_id'

/**
 * RLS (orcamentos_seller_select_own / orcamentos_admin_all) is the real
 * boundary, but a vendedor session still filters explicitly by seller_id
 * here as defense-in-depth — never rely on RLS alone to shape a query.
 */
export async function listOrcamentos(session: SessionUser) {
  const supabase = await createClient()
  let query = supabase.from('orcamentos').select(LIST_COLUMNS).order('created_at', { ascending: false })

  if (session.role !== 'admin') {
    query = query.eq('seller_id', session.id)
  }

  const { data } = await query
  return data ?? []
}

export async function getOrcamento(session: SessionUser, orcamentoId: string) {
  const supabase = await createClient()
  let query = supabase.from('orcamentos').select('*').eq('id', orcamentoId)

  if (session.role !== 'admin') {
    query = query.eq('seller_id', session.id)
  }

  const { data: orcamento } = await query.maybeSingle()
  if (!orcamento) return null

  const { data: items } = await supabase
    .from('orcamento_items')
    .select('*')
    .eq('orcamento_id', orcamentoId)
    .order('position')

  const { data: shareTokens } = await supabase
    .from('orcamento_share_tokens')
    .select('id, token, revoked, created_at')
    .eq('orcamento_id', orcamentoId)
    .order('created_at', { ascending: false })

  return { orcamento, items: items ?? [], shareTokens: shareTokens ?? [] }
}
