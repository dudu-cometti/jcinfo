import { z } from 'zod'

const optionalString = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))
  .nullable()

export const stockReceiptItemSchema = z.object({
  product_id: z.uuid(),
  variant_id: z.uuid().nullable().optional(),
  quantity: z.number().int().positive(),
  unit_cost: z.number().min(0),
})

const itemsArraySchema = z
  .string()
  .transform((v, ctx) => {
    try {
      return JSON.parse(v)
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Lista de itens inválida.' })
      return z.NEVER
    }
  })
  .pipe(z.array(stockReceiptItemSchema).min(1, { error: 'Adicione ao menos um item ao recebimento.' }))

export const stockReceiptSchema = z.object({
  supplier_name: z.string().min(2, { error: 'Informe o fornecedor.' }),
  document_number: optionalString,
  received_at: z.string().min(1, { error: 'Informe a data do recebimento.' }),
  notes: optionalString,
  items: itemsArraySchema,
})

export type StockReceiptFormState = { error?: string; receiptId?: string } | undefined

export function parseStockReceiptFormData(formData: FormData) {
  return stockReceiptSchema.safeParse({
    supplier_name: formData.get('supplier_name'),
    document_number: formData.get('document_number'),
    received_at: formData.get('received_at'),
    notes: formData.get('notes'),
    items: formData.get('items'),
  })
}
