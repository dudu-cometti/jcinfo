import { z } from 'zod'

export const brandSchema = z.object({
  name: z.string().min(2, { error: 'Informe um nome com pelo menos 2 caracteres.' }),
  slug: z
    .string()
    .min(2, { error: 'Informe um slug com pelo menos 2 caracteres.' })
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      error: 'Slug deve conter apenas letras minúsculas, números e hífens.',
    }),
})

export type BrandFormState = { error?: string } | undefined
