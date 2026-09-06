import { z } from 'zod'

const optionalString = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))
  .nullable()

export const campaignSchema = z
  .object({
    name: z.string().min(2, { error: 'Informe o nome da campanha.' }),
    description: optionalString,
    min_points: z.coerce.number({ error: 'Informe a pontuação mínima.' }).int().positive(),
    start_date: z.string().min(1, { error: 'Informe a data inicial.' }),
    end_date: z.string().min(1, { error: 'Informe a data final.' }),
    status: z.enum(['rascunho', 'ativa', 'encerrada']),
    featured: z.coerce.boolean(),
  })
  .refine((data) => new Date(data.end_date) > new Date(data.start_date), {
    error: 'A data final deve ser depois da data inicial.',
    path: ['end_date'],
  })

export type CampaignFormState = { error?: string } | undefined

export function parseCampaignFormData(formData: FormData) {
  return campaignSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    min_points: formData.get('min_points'),
    start_date: formData.get('start_date'),
    end_date: formData.get('end_date'),
    status: formData.get('status'),
    featured: formData.get('featured') === 'on',
  })
}
