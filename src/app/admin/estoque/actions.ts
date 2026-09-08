'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { stockAdjustmentSchema, type StockAdjustmentFormState } from '@/lib/validations/stock'

export async function registerStockAdjustment(
  _prevState: StockAdjustmentFormState,
  formData: FormData,
): Promise<StockAdjustmentFormState> {
  await requireRole('admin')

  const validated = stockAdjustmentSchema.safeParse({
    product_id: formData.get('product_id'),
    variant_id: formData.get('variant_id'),
    type: formData.get('type'),
    quantity: formData.get('quantity'),
    reason: formData.get('reason'),
  })
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('adjust_stock', {
    p_product_id: validated.data.product_id,
    p_type: validated.data.type,
    p_quantity: validated.data.quantity,
    p_reason: validated.data.reason,
    p_variant_id: validated.data.variant_id,
  })

  if (error) {
    return {
      error: error.message.includes('insufficient stock')
        ? 'Estoque insuficiente para esta movimentação.'
        : error.message.includes('color variants')
          ? 'Este produto tem cores cadastradas: escolha uma.'
          : 'Erro ao registrar movimentação.',
    }
  }

  revalidatePath('/admin/estoque')
  revalidatePath('/admin/produtos')
  return { success: true }
}
