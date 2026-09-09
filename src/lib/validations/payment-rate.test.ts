import { describe, expect, it } from 'vitest'
import { paymentRateRuleSchema, paymentMachineSchema } from './payment-rate'

const base = {
  machine_id: '11111111-1111-4111-8111-111111111111',
  channel: 'maquininha' as const,
  card_brand: '',
  method: 'credito' as const,
  installments: 3,
  percentage: 6.5,
  fixed_value: '',
  settlement_days: '',
  infinite_nitro: false,
  revenue_tier: '',
  fee_passed_to_customer: true,
  period_start: '',
  period_end: '',
  status: 'ativa' as const,
}

describe('paymentRateRuleSchema', () => {
  it('accepts a valid credito rule with installments > 1', () => {
    expect(paymentRateRuleSchema.safeParse(base).success).toBe(true)
  })

  it('rejects installments outside 1-18', () => {
    expect(paymentRateRuleSchema.safeParse({ ...base, installments: 19 }).success).toBe(false)
    expect(paymentRateRuleSchema.safeParse({ ...base, installments: 0 }).success).toBe(false)
  })

  it('rejects installments > 1 for a non-credito method', () => {
    const result = paymentRateRuleSchema.safeParse({ ...base, method: 'debito', installments: 2 })
    expect(result.success).toBe(false)
  })

  it('accepts installments === 1 for debito', () => {
    const result = paymentRateRuleSchema.safeParse({ ...base, method: 'debito', installments: 1 })
    expect(result.success).toBe(true)
  })

  it('rejects a percentage outside 0-100', () => {
    expect(paymentRateRuleSchema.safeParse({ ...base, percentage: -1 }).success).toBe(false)
    expect(paymentRateRuleSchema.safeParse({ ...base, percentage: 101 }).success).toBe(false)
  })
})

describe('paymentMachineSchema', () => {
  it('rejects max_installments below min_installments', () => {
    const result = paymentMachineSchema.safeParse({
      name: 'Máquina X',
      provider_key: 'generic',
      min_installments: 13,
      max_installments: 12,
      status: 'ativo',
      notes: '',
    })
    expect(result.success).toBe(false)
  })

  it('accepts a valid machine', () => {
    const result = paymentMachineSchema.safeParse({
      name: 'Máquina X',
      provider_key: 'generic',
      min_installments: 13,
      max_installments: 18,
      status: 'ativo',
      notes: '',
    })
    expect(result.success).toBe(true)
  })
})
