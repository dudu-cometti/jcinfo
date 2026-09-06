import { describe, expect, it } from 'vitest'
import { computeCartTotals } from './totals'

describe('computeCartTotals', () => {
  it('uses the promo price over the regular price when present', () => {
    const result = computeCartTotals([{ price: 2000, promoPrice: 1599, quantity: 1 }], 0)
    expect(result.subtotal).toBe(1599)
    expect(result.total).toBe(1599)
  })

  it('multiplies by quantity and sums multiple lines', () => {
    const result = computeCartTotals(
      [
        { price: 100, promoPrice: null, quantity: 3 },
        { price: 50, promoPrice: 40, quantity: 2 },
      ],
      0,
    )
    expect(result.subtotal).toBe(300 + 80)
  })

  it('applies the discount but never goes below zero', () => {
    expect(computeCartTotals([{ price: 100, promoPrice: null, quantity: 1 }], 30).total).toBe(70)
    expect(computeCartTotals([{ price: 100, promoPrice: null, quantity: 1 }], 500).total).toBe(0)
  })

  it('rejects a negative discount instead of inflating the total', () => {
    const result = computeCartTotals([{ price: 100, promoPrice: null, quantity: 1 }], -50)
    expect(result.discount).toBe(0)
    expect(result.total).toBe(100)
  })

  it('estimates points as the floor of the total (1 ponto = R$ 1,00)', () => {
    const result = computeCartTotals([{ price: 199.9, promoPrice: null, quantity: 1 }], 0)
    expect(result.estimatedPoints).toBe(199)
  })
})
