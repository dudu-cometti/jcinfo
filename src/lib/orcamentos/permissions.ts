export type OrcamentoSession = { id: string; role: 'admin' | 'vendedor' }

export type OrcamentoForPermissionCheck = {
  seller_id: string
  status: 'rascunho' | 'enviado' | 'aprovado' | 'expirado' | 'convertido' | 'cancelado'
  expires_at: string | null
}

/**
 * Pure, DB-free guards mirroring the RLS policies in
 * supabase/migrations/20260101000038_orcamentos.sql /
 * 20260101000042_convert_orcamento_function.sql — unit-testable without a
 * live Supabase instance. RLS is still the real enforcement boundary; this
 * is defense-in-depth plus a fast, testable expression of the rule.
 */
export function canManageOrcamento(session: OrcamentoSession, orcamento: OrcamentoForPermissionCheck): boolean {
  if (session.role === 'admin') return true
  return orcamento.seller_id === session.id
}

export function canEditOrcamento(session: OrcamentoSession, orcamento: OrcamentoForPermissionCheck): boolean {
  if (!canManageOrcamento(session, orcamento)) return false
  // Mirrors orcamentos_seller_update_own (blocked once terminal) vs
  // orcamentos_admin_all (no status restriction — admin may still correct
  // a record for audit purposes).
  if (session.role === 'admin') return true
  return orcamento.status !== 'convertido' && orcamento.status !== 'cancelado'
}

export function isOrcamentoExpired(orcamento: OrcamentoForPermissionCheck, now: Date = new Date()): boolean {
  if (!orcamento.expires_at) return false
  return new Date(orcamento.expires_at).getTime() < now.getTime()
}

export function canConvertOrcamento(
  session: OrcamentoSession,
  orcamento: OrcamentoForPermissionCheck,
  now: Date = new Date(),
): boolean {
  if (!canManageOrcamento(session, orcamento)) return false
  if (orcamento.status !== 'enviado' && orcamento.status !== 'aprovado') return false
  if (isOrcamentoExpired(orcamento, now)) return false
  return true
}
