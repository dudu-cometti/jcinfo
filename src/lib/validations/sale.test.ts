import { describe, expect, it } from 'vitest'
import { createSaleSchema } from './sale'

describe('createSaleSchema', () => {
  it('rejects a sale with no items (a sale must always have items, never just a total)', () => {
    const result = createSaleSchema.safeParse({
      customer_id: '11111111-1111-4111-8111-111111111111',
      items: [],
      discount: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects an item with zero or negative quantity', () => {
    const result = createSaleSchema.safeParse({
      customer_id: '11111111-1111-4111-8111-111111111111',
      items: [{ product_id: '22222222-2222-4222-8222-222222222222', quantity: 0 }],
      discount: 0,
    })
    expect(result.success).toBe(false)
  })

  it('accepts a well-formed sale with one or more items', () => {
    const result = createSaleSchema.safeParse({
      customer_id: '11111111-1111-4111-8111-111111111111',
      items: [{ product_id: '22222222-2222-4222-8222-222222222222', quantity: 2 }],
      discount: 10,
    })
    expect(result.success).toBe(true)
  })
})
