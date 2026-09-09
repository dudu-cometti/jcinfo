import { z } from 'zod'

const optionalString = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))
  .nullable()

const optionalNumber = z
  .string()
  .transform((v) => (v.trim() === '' ? null : Number(v)))
  .pipe(z.number().min(0).nullable())

export const productSchema = z
  .object({
    name: z.string().min(2, { error: 'Informe o nome do produto.' }),
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      error: 'Slug deve conter apenas letras minúsculas, números e hífens.',
    }),
    description: optionalString,
    category_id: optionalString,
    brand_id: optionalString,
    model: optionalString,
    price: z.coerce.number({ error: 'Informe um preço válido.' }).min(0),
    promo_price: optionalNumber,
    cost: optionalNumber,
    // stock é deliberadamente ausente daqui: não é editável pelo formulário
    // de produto — a única via para mudar estoque é o fluxo de "Entrada de
    // estoque" (receive_stock) ou os outros movimentos SQL (venda, ajuste,
    // estorno). Um produto novo sempre nasce com stock = 0 (garantido pelo
    // banco, ver migration 20260101000054).
    min_stock: z.coerce.number({ error: 'Informe um estoque mínimo válido.' }).int().min(0),
    sku: optionalString,
    internal_code: optionalString,
    status: z.enum(['ativo', 'inativo']),
    featured: z.coerce.boolean(),
    condition: z.enum(['novo', 'seminovo']),
  })
  .refine((data) => data.promo_price === null || data.promo_price < data.price, {
    error: 'O preço promocional deve ser menor que o preço original.',
    path: ['promo_price'],
  })

export type ProductFormState = { error?: string } | undefined

export function parseProductFormData(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    category_id: formData.get('category_id'),
    brand_id: formData.get('brand_id'),
    model: formData.get('model'),
    price: formData.get('price'),
    promo_price: formData.get('promo_price'),
    cost: formData.get('cost'),
    min_stock: formData.get('min_stock'),
    sku: formData.get('sku'),
    internal_code: formData.get('internal_code'),
    status: formData.get('status'),
    featured: formData.get('featured') === 'on',
    condition: formData.get('condition'),
  })
}
