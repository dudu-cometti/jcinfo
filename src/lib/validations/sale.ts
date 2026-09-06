import { z } from 'zod'

export const saleItemSchema = z.object({
  product_id: z.uuid(),
  quantity: z.number().int().positive(),
})

export const createSaleSchema = z.object({
  customer_id: z.uuid({ error: 'Selecione um cliente.' }),
  items: z.array(saleItemSchema).min(1, { error: 'Adicione ao menos um produto à venda.' }),
  discount: z.number().min(0).default(0),
  notes: z.string().nullable().optional(),
})

export type CreateSaleState = { error?: string; saleId?: string } | undefined
export type SaleActionState = { error?: string } | undefined
