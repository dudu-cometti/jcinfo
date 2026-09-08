import { z } from 'zod'

const optionalUuid = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))
  .pipe(z.uuid().nullable())

export const stockAdjustmentSchema = z.object({
  product_id: z.uuid({ error: 'Selecione um produto.' }),
  variant_id: optionalUuid,
  type: z.enum(['entrada', 'saida', 'ajuste'], { error: 'Selecione o tipo de movimentação.' }),
  quantity: z.coerce.number({ error: 'Informe uma quantidade válida.' }).int(),
  reason: z.string().min(3, { error: 'Descreva o motivo da movimentação.' }),
})

export type StockAdjustmentFormState = { error?: string; success?: boolean } | undefined
