import { z } from 'zod'

const optionalString = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))
  .nullable()

export const rewardSchema = z.object({
  name: z.string().min(2, { error: 'Informe o nome do prêmio.' }),
  description: optionalString,
  image_url: optionalString,
  quantity: z.coerce.number({ error: 'Informe a quantidade disponível.' }).int().min(0),
  points_required: z.coerce.number({ error: 'Informe os pontos necessários.' }).int().positive(),
  status: z.enum(['ativo', 'inativo']),
})

export type RewardFormState = { error?: string } | undefined

export function parseRewardFormData(formData: FormData) {
  return rewardSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    image_url: formData.get('image_url'),
    quantity: formData.get('quantity'),
    points_required: formData.get('points_required'),
    status: formData.get('status'),
  })
}
