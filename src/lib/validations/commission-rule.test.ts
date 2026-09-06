import { describe, expect, it } from 'vitest'
import { commissionRuleSchema } from './commission-rule'

const base = {
  name: 'Comissão padrão',
  description: '',
  period_start: '',
  period_end: '',
  status: 'ativa' as const,
}

describe('commissionRuleSchema', () => {
  it('accepts a percentage-only rule', () => {
    expect(commissionRuleSchema.safeParse({ ...base, percentage: '3', fixed_value: '' }).success).toBe(true)
  })

  it('accepts a fixed-value-only rule', () => {
    expect(commissionRuleSchema.safeParse({ ...base, percentage: '', fixed_value: '10' }).success).toBe(true)
  })

  it('rejects a rule with neither percentage nor fixed value (the commission rule must be configurable, never implicit)', () => {
    expect(commissionRuleSchema.safeParse({ ...base, percentage: '', fixed_value: '' }).success).toBe(false)
  })
})
