'use server'

import { revalidatePath } from 'next/cache'
import { requireRole, type SessionUser } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/data/settings'
import { validateFreight, FreightExceedsMaxError } from '@/lib/orcamentos/freight'
import { generateShareToken } from '@/lib/orcamentos/share-tokens'
import {
  parseCreateOrcamentoFormData,
  type OrcamentoFormState,
  type OrcamentoActionState,
} from '@/lib/validations/orcamento'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

/**
 * Every mutation here delegates to a SECURITY DEFINER SQL function
 * (create_orcamento/send_orcamento/approve_orcamento/cancel_orcamento/
 * convert_orcamento_to_sale — supabase/migrations/20260101000044,
 * 20260101000045) that looks up products/variants/prices/stock/machine/
 * taxa and computes subtotal/frete/taxa/total/parcelas itself, inside the
 * transaction. Nothing here ever does `.insert()`/`.update()` on
 * `orcamentos`/`orcamento_items` directly — RLS (migration 20260101000043)
 * no longer grants the seller write access to those tables at all, so a
 * direct table call would be rejected regardless.
 */
function translateOrcamentoError(message: string): string {
  if (message.includes('freight value exceeds')) return 'O frete informado excede o limite configurado.'
  if (message.includes('discount') && message.includes('exceed')) return 'O desconto não pode ser maior que o subtotal.'
  if (message.includes('machine invalid')) return 'Máquina inválida ou inativa.'
  if (message.includes('only accepts')) return 'Número de parcelas fora do intervalo aceito por esta máquina.'
  if (message.includes('no active rate rule')) return 'Nenhuma taxa ativa para esta combinação de máquina, forma de pagamento, parcelas e bandeira.'
  if (message.includes('select a color')) return 'Selecione a cor de um dos produtos adicionados.'
  if (message.includes('has no color variants')) return 'Um dos produtos não possui cores cadastradas.'
  if (message.includes('does not belong to product')) return 'A variante selecionada não pertence ao produto informado.'
  if (message.includes('customer') && message.includes('not found')) return 'Cliente não encontrado.'
  if (message.includes('product') && message.includes('not found')) return 'Produto não encontrado.'
  if (message.includes('insufficient stock')) return 'Estoque insuficiente para converter este orçamento.'
  if (message.includes('no longer available')) return 'Um produto ou cor do orçamento não está mais disponível.'
  if (message.includes('has expired') || message.includes('expired')) return 'Este orçamento expirou.'
  if (message.includes('no linked customer')) return 'Este orçamento não tem um cliente vinculado.'
  if (message.includes('cannot be converted from status')) return 'Este orçamento não pode ser convertido no status atual.'
  if (message.includes('cannot be cancelled from status')) return 'Este orçamento não pode mais ser cancelado.'
  if (message.includes('is immutable outside rascunho')) return 'Este orçamento não pode mais ser editado (só um rascunho pode).'
  if (message.includes('only a rascunho')) return 'Apenas um rascunho pode ser enviado.'
  if (message.includes('only an enviado')) return 'Apenas um orçamento enviado pode ser aprovado.'
  if (message.includes('unauthorized')) return 'Você não tem permissão para esta ação.'
  return 'Erro ao processar o orçamento.'
}

export async function createOrcamento(
  _prevState: OrcamentoFormState,
  formData: FormData,
): Promise<OrcamentoFormState> {
  await requireRole('admin', 'vendedor')

  const validated = parseCreateOrcamentoFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const settings = await getSiteSettings()
  try {
    validateFreight(validated.data.freight_value, settings.freight_max_value)
  } catch (freightError) {
    if (freightError instanceof FreightExceedsMaxError) return { error: freightError.message }
    throw freightError
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('create_orcamento', {
    p_customer_id: validated.data.customer_id,
    p_items: validated.data.items,
    p_discount: validated.data.discount,
    p_freight_value: validated.data.freight_value,
    p_machine_id: validated.data.machine_id,
    p_payment_method: validated.data.payment_method,
    p_card_brand: validated.data.card_brand,
    p_installments: validated.data.installments,
    p_validity_days: validated.data.validity_days,
    p_notes: validated.data.notes,
  })

  if (error) {
    return { error: translateOrcamentoError(error.message) }
  }

  revalidatePath('/vendedor/orcamentos')
  revalidatePath('/admin/orcamentos')
  return { orcamentoId: data as string }
}

export async function updateOrcamento(
  orcamentoId: string,
  _prevState: OrcamentoFormState,
  formData: FormData,
): Promise<OrcamentoFormState> {
  await requireRole('admin', 'vendedor')

  const validated = parseCreateOrcamentoFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const settings = await getSiteSettings()
  try {
    validateFreight(validated.data.freight_value, settings.freight_max_value)
  } catch (freightError) {
    if (freightError instanceof FreightExceedsMaxError) return { error: freightError.message }
    throw freightError
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('update_orcamento', {
    p_orcamento_id: orcamentoId,
    p_items: validated.data.items,
    p_discount: validated.data.discount,
    p_freight_value: validated.data.freight_value,
    p_machine_id: validated.data.machine_id,
    p_payment_method: validated.data.payment_method,
    p_card_brand: validated.data.card_brand,
    p_installments: validated.data.installments,
    p_validity_days: validated.data.validity_days,
    p_notes: validated.data.notes,
  })

  if (error) {
    return { error: translateOrcamentoError(error.message) }
  }

  revalidatePath('/vendedor/orcamentos')
  revalidatePath('/admin/orcamentos')
  revalidatePath(`/vendedor/orcamentos/${orcamentoId}`)
  revalidatePath(`/admin/orcamentos/${orcamentoId}`)
  return { orcamentoId }
}

async function loadOrcamentoForShareAction(supabase: SupabaseServerClient, session: SessionUser, orcamentoId: string) {
  const { data } = await supabase.from('orcamentos').select('id, seller_id').eq('id', orcamentoId).maybeSingle()
  if (!data) return null
  if (data.seller_id !== session.id && session.role !== 'admin') return null
  return data
}

export async function sendOrcamento(orcamentoId: string): Promise<OrcamentoActionState> {
  await requireRole('admin', 'vendedor')
  const supabase = await createClient()

  const { error } = await supabase.rpc('send_orcamento', { p_orcamento_id: orcamentoId })
  if (error) return { error: translateOrcamentoError(error.message) }

  revalidatePath('/vendedor/orcamentos')
  revalidatePath('/admin/orcamentos')
  return undefined
}

export async function approveOrcamento(orcamentoId: string): Promise<OrcamentoActionState> {
  await requireRole('admin', 'vendedor')
  const supabase = await createClient()

  const { error } = await supabase.rpc('approve_orcamento', { p_orcamento_id: orcamentoId })
  if (error) return { error: translateOrcamentoError(error.message) }

  revalidatePath('/vendedor/orcamentos')
  revalidatePath('/admin/orcamentos')
  return undefined
}

export async function cancelOrcamento(orcamentoId: string, reason: string): Promise<OrcamentoActionState> {
  await requireRole('admin', 'vendedor')
  const supabase = await createClient()

  const { error } = await supabase.rpc('cancel_orcamento', { p_orcamento_id: orcamentoId, p_reason: reason || null })
  if (error) return { error: translateOrcamentoError(error.message) }

  revalidatePath('/vendedor/orcamentos')
  revalidatePath('/admin/orcamentos')
  return undefined
}

export async function convertOrcamento(orcamentoId: string): Promise<{ error?: string; saleId?: string }> {
  await requireRole('admin', 'vendedor')
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('convert_orcamento_to_sale', { p_orcamento_id: orcamentoId })
  if (error) {
    return { error: translateOrcamentoError(error.message) }
  }

  revalidatePath('/vendedor/orcamentos')
  revalidatePath('/admin/orcamentos')
  revalidatePath('/vendedor/vendas')
  revalidatePath('/admin/vendas')
  return { saleId: data as string }
}

export async function createShareToken(orcamentoId: string): Promise<{ error?: string; token?: string }> {
  const session = await requireRole('admin', 'vendedor')
  const supabase = await createClient()

  const orcamento = await loadOrcamentoForShareAction(supabase, session, orcamentoId)
  if (!orcamento) return { error: 'Orçamento não encontrado.' }

  const token = generateShareToken()
  const { error } = await supabase
    .from('orcamento_share_tokens')
    .insert({ orcamento_id: orcamentoId, token, created_by: session.id })

  if (error) return { error: 'Erro ao gerar link de compartilhamento.' }

  revalidatePath(`/vendedor/orcamentos/${orcamentoId}`)
  revalidatePath(`/admin/orcamentos/${orcamentoId}`)
  return { token }
}

export async function revokeShareToken(tokenId: string, orcamentoId: string): Promise<OrcamentoActionState> {
  const session = await requireRole('admin', 'vendedor')
  const supabase = await createClient()

  const orcamento = await loadOrcamentoForShareAction(supabase, session, orcamentoId)
  if (!orcamento) return { error: 'Orçamento não encontrado.' }

  const { error } = await supabase.from('orcamento_share_tokens').update({ revoked: true }).eq('id', tokenId)
  if (error) return { error: 'Erro ao revogar o link.' }

  revalidatePath(`/vendedor/orcamentos/${orcamentoId}`)
  revalidatePath(`/admin/orcamentos/${orcamentoId}`)
  return undefined
}
