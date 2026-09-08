'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { createSaleSchema, type CreateSaleState, type SaleActionState } from '@/lib/validations/sale'

/**
 * Every mutation here delegates to a SECURITY DEFINER SQL function
 * (supabase/migrations/000011_sale_functions.sql) that recomputes price,
 * stock, points and commission atomically — the client-submitted cart is
 * only ever used to say WHICH products/quantities, never their price/total.
 */
export async function createSale(
  customerId: string,
  items: { product_id: string; variant_id?: string | null; quantity: number }[],
  discount: number,
  notes: string,
): Promise<CreateSaleState> {
  await requireRole('admin', 'vendedor')

  const validated = createSaleSchema.safeParse({
    customer_id: customerId,
    items,
    discount,
    notes: notes || null,
  })
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('register_sale', {
    p_customer_id: validated.data.customer_id,
    p_items: validated.data.items,
    p_discount: validated.data.discount,
    p_notes: validated.data.notes,
    p_origin: 'painel_vendedor',
  })

  if (error) {
    return { error: translateSaleError(error.message) }
  }

  revalidatePath('/vendedor/vendas')
  revalidatePath('/admin/vendas')
  return { saleId: data as string }
}

export async function confirmSaleAction(saleId: string): Promise<SaleActionState> {
  await requireRole('admin', 'vendedor')
  const supabase = await createClient()
  const { error } = await supabase.rpc('confirm_sale', { p_sale_id: saleId })
  if (error) return { error: translateSaleError(error.message) }

  revalidatePath(`/vendedor/vendas/${saleId}`)
  revalidatePath(`/admin/vendas/${saleId}`)
  revalidatePath('/vendedor/vendas')
  revalidatePath('/admin/vendas')
  return undefined
}

export async function completeSaleAction(saleId: string): Promise<SaleActionState> {
  await requireRole('admin', 'vendedor')
  const supabase = await createClient()
  const { error } = await supabase.rpc('complete_sale', { p_sale_id: saleId })
  if (error) return { error: translateSaleError(error.message) }

  revalidatePath(`/vendedor/vendas/${saleId}`)
  revalidatePath(`/admin/vendas/${saleId}`)
  return undefined
}

export async function cancelSaleAction(saleId: string, reason: string): Promise<SaleActionState> {
  await requireRole('admin', 'vendedor')
  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_sale', { p_sale_id: saleId, p_reason: reason || null })
  if (error) return { error: translateSaleError(error.message) }

  revalidatePath(`/vendedor/vendas/${saleId}`)
  revalidatePath(`/admin/vendas/${saleId}`)
  revalidatePath('/vendedor/vendas')
  revalidatePath('/admin/vendas')
  return undefined
}

export async function reverseSaleAction(saleId: string, reason: string): Promise<SaleActionState> {
  await requireRole('admin')
  if (!reason || reason.trim().length === 0) {
    return { error: 'Informe o motivo do estorno.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('reverse_sale', { p_sale_id: saleId, p_reason: reason })
  if (error) return { error: translateSaleError(error.message) }

  revalidatePath(`/vendedor/vendas/${saleId}`)
  revalidatePath(`/admin/vendas/${saleId}`)
  revalidatePath('/admin/vendas')
  revalidatePath('/admin/comissoes')
  return undefined
}

function translateSaleError(message: string): string {
  if (message.includes('insufficient stock')) return 'Estoque insuficiente para um ou mais produtos.'
  if (message.includes('select a color')) return 'Selecione a cor de um dos produtos adicionados.'
  if (message.includes('not found')) return 'Cliente, produto ou cor não encontrado.'
  if (message.includes('is not active')) return 'Um dos produtos ou cores selecionados está inativo.'
  if (message.includes('not pendente')) return 'Esta venda não está mais pendente.'
  if (message.includes('must be confirmada')) return 'A venda precisa estar confirmada antes de ser concluída.'
  if (message.includes('reason is required')) return 'Informe o motivo.'
  if (message.includes('unauthorized')) return 'Você não tem permissão para esta ação.'
  return 'Erro ao processar a venda.'
}
