import { z } from 'zod'
import { normalizePhone } from '@/lib/utils'

export const leadSchema = z.object({
  name: z.string().min(2, { error: 'Informe seu nome.' }),
  phone: z
    .string()
    .min(1, { error: 'Informe seu telefone.' })
    .transform(normalizePhone)
    .pipe(z.string().min(10, { error: 'Telefone inválido. Use DDD + número.' })),
})

export type LeadFormState = { error?: string; customerId?: string } | undefined
