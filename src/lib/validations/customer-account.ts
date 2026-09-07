import { z } from 'zod'
import { normalizePhone, normalizeCpf, isValidCpf } from '@/lib/utils'

export const customerRegisterSchema = z
  .object({
    name: z.string().min(2, { error: 'Informe seu nome.' }),
    phone: z
      .string()
      .min(1, { error: 'Informe seu telefone.' })
      .transform(normalizePhone)
      .pipe(z.string().min(10, { error: 'Telefone inválido. Use DDD + número.' })),
    email: z.email({ error: 'Informe um e-mail válido.' }),
    cpf: z
      .string()
      .min(1, { error: 'Informe seu CPF.' })
      .transform(normalizeCpf)
      .refine((v) => isValidCpf(v), { error: 'CPF inválido.' }),
    password: z.string().min(8, { error: 'A senha deve ter pelo menos 8 caracteres.' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: 'As senhas não coincidem.',
    path: ['confirmPassword'],
  })

export type CustomerRegisterState = { error?: string } | undefined

export const customerLoginSchema = z.object({
  email: z.email({ error: 'Informe um e-mail válido.' }),
  password: z.string().min(1, { error: 'Informe a senha.' }),
})

export type CustomerLoginState = { error?: string } | undefined
