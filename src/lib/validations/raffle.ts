import { z } from 'zod'

const optionalString = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))
  .nullable()

const optionalUuid = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))
  .pipe(z.uuid().nullable())

export const raffleSchema = z.object({
  name: z.string().min(2, { error: 'Informe o nome do sorteio.' }),
  description: optionalString,
  reward_id: optionalUuid,
  campaign_id: optionalUuid,
  raffle_date: z.string().min(1, { error: 'Informe a data do sorteio.' }),
  status: z.enum(['aberto', 'encerrado', 'cancelado']),
})

export type RaffleFormState = { error?: string } | undefined

export function parseRaffleFormData(formData: FormData) {
  return raffleSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    reward_id: formData.get('reward_id'),
    campaign_id: formData.get('campaign_id'),
    raffle_date: formData.get('raffle_date'),
    status: formData.get('status'),
  })
}
