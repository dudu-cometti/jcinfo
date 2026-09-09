import { z } from 'zod'

const optionalString = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))
  .nullable()

export const orcamentoItemSchema = z.object({
  product_id: z.uuid(),
  variant_id: z.uuid().nullable().optional(),
  quantity: z.number().int().positive(),
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
  .pipe(z.array(orcamentoItemSchema).min(1, { error: 'Adicione ao menos um produto ao orçamento.' }))

export const createOrcamentoSchema = z.object({
  customer_id: z.uuid({ error: 'Selecione um cliente.' }),
  items: itemsArraySchema,
  discount: z.coerce.number().min(0).default(0),
  freight_value: z.coerce.number().min(0).default(0),
  machine_id: z.uuid({ error: 'Selecione a máquina.' }),
  payment_method: z.enum(['pix', 'dinheiro', 'debito', 'credito'], { error: 'Selecione a forma de pagamento.' }),
  card_brand: optionalString,
  installments: z.coerce.number().int().min(1).max(18).default(1),
  validity_days: z.coerce.number().int().min(1).default(3),
  notes: optionalString,
})

export type OrcamentoFormState = { error?: string; orcamentoId?: string } | undefined
export type OrcamentoActionState = { error?: string } | undefined

export function parseCreateOrcamentoFormData(formData: FormData) {
  return createOrcamentoSchema.safeParse({
    customer_id: formData.get('customer_id'),
    items: formData.get('items'),
    discount: formData.get('discount') || 0,
    freight_value: formData.get('freight_value') || 0,
    machine_id: formData.get('machine_id'),
    payment_method: formData.get('payment_method'),
    card_brand: formData.get('card_brand'),
    installments: formData.get('installments') || 1,
    validity_days: formData.get('validity_days') || 3,
    notes: formData.get('notes'),
  })
}
