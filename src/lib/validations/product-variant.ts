import { z } from 'zod'

const optionalString = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))
  .nullable()

const optionalPrice = z
  .string()
  .transform((v) => (v.trim() === '' ? null : Number(v)))
  .pipe(z.number().min(0).nullable())

export const productVariantSchema = z
  .object({
    color_name: z.string().min(1, { error: 'Informe o nome da cor.' }),
    color_hex: optionalString,
    price: z.coerce.number({ error: 'Informe um preço válido.' }).min(0),
    promo_price: optionalPrice,
    // stock não é editável aqui — só via "Entrada de estoque"
    // (receive_stock) ou os outros movimentos SQL. Uma cor nova sempre
    // nasce com stock = 0 (garantido pelo banco).
    sku: optionalString,
    status: z.enum(['ativo', 'inativo']),
  })
  .refine((data) => data.promo_price === null || data.promo_price < data.price, {
    error: 'O preço promocional deve ser menor que o preço original.',
    path: ['promo_price'],
  })

export type ProductVariantFormState = { error?: string } | undefined

export function parseProductVariantFormData(formData: FormData) {
  return productVariantSchema.safeParse({
    color_name: formData.get('color_name'),
    color_hex: formData.get('color_hex'),
    price: formData.get('price'),
    promo_price: formData.get('promo_price'),
    sku: formData.get('sku'),
    status: formData.get('status'),
  })
}
