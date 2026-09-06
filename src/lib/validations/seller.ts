import { z } from 'zod'

export const createSellerSchema = z.object({
  full_name: z.string().min(2, { error: 'Informe o nome completo.' }),
  email: z.email({ error: 'Informe um e-mail válido.' }),
  password: z.string().min(6, { error: 'A senha deve ter pelo menos 6 caracteres.' }),
  role: z.enum(['admin', 'vendedor']),
})

export type CreateSellerFormState = { error?: string } | undefined
