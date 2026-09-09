'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { parseStockReceiptFormData, type StockReceiptFormState } from '@/lib/validations/stock-receipt'
import { validateReceiptItems, InvalidReceiptItemError, type ProductVariantMap } from '@/lib/stock/receipt-validation'

export async function createStockReceipt(
  _prevState: StockReceiptFormState,
  formData: FormData,
): Promise<StockReceiptFormState> {
  await requireRole('admin')

  const validated = parseStockReceiptFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()

  const productIds = [...new Set(validated.data.items.map((item) => item.product_id))]
  const { data: variantRows } = await supabase
    .from('product_variants')
    .select('id, product_id')
    .in('product_id', productIds)

  const variantsByProduct: ProductVariantMap = {}
  for (const row of variantRows ?? []) {
    ;(variantsByProduct[row.product_id] ??= []).push(row.id)
  }

  try {
    validateReceiptItems(validated.data.items, variantsByProduct)
  } catch (validationError) {
    if (validationError instanceof InvalidReceiptItemError) {
      return { error: validationError.message }
    }
    throw validationError
  }

  const { data, error } = await supabase.rpc('receive_stock', {
    p_supplier_name: validated.data.supplier_name,
    p_items: validated.data.items,
    p_document_number: validated.data.document_number,
    p_received_at: validated.data.received_at,
    p_notes: validated.data.notes,
  })

  if (error) {
    return {
      error: error.message.includes('color variants')
        ? 'Um dos produtos tem cores cadastradas: escolha uma.'
        : error.message.includes('not found')
          ? 'Produto não encontrado.'
          : 'Erro ao registrar o recebimento.',
    }
  }

  revalidatePath('/admin/entradas')
  revalidatePath('/admin/estoque')
  revalidatePath('/admin/estoque/historico')
  revalidatePath('/admin/produtos')
  return { receiptId: data as string }
}

/**
 * Nunca edita/apaga a entrada (RLS da migration 20260101000053 nem
 * permite mais UPDATE/DELETE direto). Estornar cria uma movimentação nova
 * e negativa, referenciando a entrada original, e marca a entrada como
 * estornada — o registro original nunca é alterado.
 */
export async function reverseStockReceipt(receiptId: string, reason: string): Promise<{ error?: string }> {
  await requireRole('admin')

  if (!reason || reason.trim().length === 0) {
    return { error: 'Informe o motivo do estorno.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('reverse_stock_receipt', { p_receipt_id: receiptId, p_reason: reason })

  if (error) {
    return {
      error: error.message.includes('already been reversed')
        ? 'Esta entrada já foi estornada.'
        : error.message.includes('negative stock')
          ? 'O estorno deixaria o estoque negativo para um dos produtos — ajuste o estoque manualmente antes.'
          : 'Erro ao estornar a entrada.',
    }
  }

  revalidatePath('/admin/entradas')
  revalidatePath(`/admin/entradas/${receiptId}`)
  revalidatePath('/admin/estoque')
  revalidatePath('/admin/estoque/historico')
  revalidatePath('/admin/produtos')
  return {}
}
