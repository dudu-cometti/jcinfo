import { z } from 'zod'
import { normalizePhone } from '@/lib/utils'

export const customerSchema = z.object({
  name: z.string().min(2, { error: 'Informe o nome do cliente.' }),
  phone: z
    .string()
    .min(1, { error: 'Informe o telefone do cliente.' })
    .transform(normalizePhone)
    .pipe(z.string().min(10, { error: 'Telefone inválido. Use DDD + número.' })),
  email: z
    .string()
    .transform((v) => (v.trim() === '' ? null : v.trim()))
    .pipe(z.email({ error: 'E-mail inválido.' }).nullable()),
  notes: z
    .string()
    .transform((v) => (v.trim() === '' ? null : v.trim()))
    .nullable(),
})

export type CustomerFormState = { error?: string; customerId?: string } | undefined

export function parseCustomerFormData(formData: FormData) {
  return customerSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    notes: formData.get('notes'),
  })
}
