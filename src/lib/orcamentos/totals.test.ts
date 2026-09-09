import { describe, expect, it } from 'vitest'
import { computeOrcamentoTotals } from './totals'
import type { RateRuleInput } from '@/lib/payments/fees'

const rules: RateRuleInput[] = [
  { id: 'r1', machineId: 'm1', method: 'credito', installments: 6, percentage: 8, fixedValue: 0, cardBrand: null },
]

describe('computeOrcamentoTotals', () => {
  it('sums item lines into the subtotal', () => {
    const result = computeOrcamentoTotals({
      items: [{ unitPrice: 100, quantity: 2 }, { unitPrice: 50, quantity: 1 }],
      discount: 0,
      freight: 0,
      method: 'pix',
      installments: 1,
      machineId: 'm1',
      rules,
    })
    expect(result.subtotal).toBe(250)
    expect(result.finalValue).toBe(250)
  })

  it('clamps the discount so it never exceeds the subtotal (never negative base)', () => {
    const result = computeOrcamentoTotals({
      items: [{ unitPrice: 100, quantity: 1 }],
      discount: 500,
      freight: 0,
      method: 'pix',
      installments: 1,
      machineId: 'm1',
      rules,
    })
    expect(result.discount).toBe(100)
    expect(result.baseValue).toBe(0)
  })

  it('does not let a negative freight reduce the base value', () => {
    const result = computeOrcamentoTotals({
      items: [{ unitPrice: 100, quantity: 1 }],
      discount: 0,
      freight: -50,
      method: 'pix',
      installments: 1,
      machineId: 'm1',
      rules,
    })
    expect(result.baseValue).toBe(100)
  })

  it('is a pure function: calling it twice with the same input yields the same output (no hidden catalog mutation)', () => {
    const input = {
      items: [{ unitPrice: 199.9, quantity: 3 }],
      discount: 10,
      freight: 140,
      method: 'credito' as const,
      installments: 6,
      machineId: 'm1',
      rules,
    }
    expect(computeOrcamentoTotals(input)).toEqual(computeOrcamentoTotals(input))
  })
})
