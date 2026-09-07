import { z } from 'zod'

const optionalString = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))
  .nullable()

const optionalNumber = z
  .string()
  .transform((v) => (v.trim() === '' ? null : Number(v)))
  .pipe(z.number().min(0).nullable())

const optionalPercentage = z
  .string()
  .transform((v) => (v.trim() === '' ? null : Number(v)))
  .pipe(z.number().min(0).max(100).nullable())

const optionalUuid = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))
  .pipe(z.uuid().nullable())

export const preorderCampaignSchema = z.object({
  name: z.string().min(2, { error: 'Informe o nome do produto/campanha.' }),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
    error: 'Slug deve conter apenas letras minúsculas, números e hífens.',
  }),
  description: optionalString,
  image_url: optionalString,
  expected_price: optionalNumber,
  expected_date: optionalString,
  discount_percentage: optionalPercentage,
  reward_id: optionalUuid,
  status: z.enum(['aberta', 'encerrada', 'cancelada']),
})

export type PreorderCampaignFormState = { error?: string } | undefined

export function parsePreorderCampaignFormData(formData: FormData) {
  return preorderCampaignSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    image_url: formData.get('image_url'),
    expected_price: formData.get('expected_price'),
    expected_date: formData.get('expected_date'),
    discount_percentage: formData.get('discount_percentage'),
    reward_id: formData.get('reward_id'),
    status: formData.get('status'),
  })
}
