import { z } from 'zod'

const optionalString = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))
  .nullable()

const optionalNumber = z
  .string()
  .transform((v) => (v.trim() === '' ? null : Number(v)))
  .pipe(z.number().min(0).nullable())

const optionalDate = z
  .string()
  .transform((v) => (v.trim() === '' ? null : v.trim()))
  .nullable()

export const commissionRuleSchema = z
  .object({
    name: z.string().min(2, { error: 'Informe o nome da regra.' }),
    percentage: optionalNumber,
    fixed_value: optionalNumber,
    description: optionalString,
    period_start: optionalDate,
    period_end: optionalDate,
    status: z.enum(['ativa', 'inativa']),
  })
  .refine((data) => data.percentage !== null || data.fixed_value !== null, {
    error: 'Informe um percentual ou um valor fixo.',
    path: ['percentage'],
  })

export type CommissionRuleFormState = { error?: string } | undefined

export function parseCommissionRuleFormData(formData: FormData) {
  return commissionRuleSchema.safeParse({
    name: formData.get('name'),
    percentage: formData.get('percentage'),
    fixed_value: formData.get('fixed_value'),
    description: formData.get('description'),
    period_start: formData.get('period_start'),
    period_end: formData.get('period_end'),
    status: formData.get('status'),
  })
}
