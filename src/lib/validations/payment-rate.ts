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

export const paymentMachineSchema = z.object({
  name: z.string().min(2, { error: 'Informe o nome da máquina.' }),
  provider_key: z.string().min(1).default('generic'),
  min_installments: z.coerce.number().int().min(1),
  max_installments: z.coerce.number().int().min(1),
  status: z.enum(['ativo', 'inativo']),
  notes: optionalString,
}).refine((data) => data.max_installments >= data.min_installments, {
  error: 'O máximo de parcelas não pode ser menor que o mínimo.',
  path: ['max_installments'],
})

export type PaymentMachineFormState = { error?: string; success?: boolean } | undefined

export function parsePaymentMachineFormData(formData: FormData) {
  return paymentMachineSchema.safeParse({
    name: formData.get('name'),
    provider_key: formData.get('provider_key') || 'generic',
    min_installments: formData.get('min_installments'),
    max_installments: formData.get('max_installments'),
    status: formData.get('status'),
    notes: formData.get('notes'),
  })
}

export const paymentRateRuleSchema = z
  .object({
    machine_id: z.uuid({ error: 'Selecione a máquina.' }),
    channel: z.enum(['maquininha', 'infinitap', 'link']).default('maquininha'),
    card_brand: optionalString,
    method: z.enum(['pix', 'dinheiro', 'debito', 'credito'], { error: 'Selecione a forma de pagamento.' }),
    installments: z.coerce.number().int().min(1).max(18),
    percentage: z.coerce.number().min(0).max(100),
    fixed_value: optionalNumber,
    settlement_days: z
      .string()
      .transform((v) => (v.trim() === '' ? null : Number(v)))
      .pipe(z.number().int().min(0).nullable()),
    infinite_nitro: z.coerce.boolean().default(false),
    revenue_tier: optionalString,
    fee_passed_to_customer: z.coerce.boolean().default(true),
    period_start: optionalDate,
    period_end: optionalDate,
    status: z.enum(['ativa', 'inativa']),
  })
  .refine((data) => data.method === 'credito' || data.installments === 1, {
    error: 'Apenas crédito pode ter mais de 1 parcela.',
    path: ['installments'],
  })

export type PaymentRateRuleFormState = { error?: string; success?: boolean } | undefined

export function parsePaymentRateRuleFormData(formData: FormData) {
  return paymentRateRuleSchema.safeParse({
    machine_id: formData.get('machine_id'),
    channel: formData.get('channel') || 'maquininha',
    card_brand: formData.get('card_brand'),
    method: formData.get('method'),
    installments: formData.get('installments'),
    percentage: formData.get('percentage'),
    fixed_value: formData.get('fixed_value'),
    settlement_days: formData.get('settlement_days'),
    infinite_nitro: formData.get('infinite_nitro') === 'on',
    revenue_tier: formData.get('revenue_tier'),
    fee_passed_to_customer: formData.get('fee_passed_to_customer') !== 'off',
    period_start: formData.get('period_start'),
    period_end: formData.get('period_end'),
    status: formData.get('status'),
  })
}
