import { describe, expect, it } from 'vitest'
import { productSchema } from './product'

const base = {
  name: 'iPhone 15',
  slug: 'iphone-15',
  description: '',
  category_id: '',
  brand_id: '',
  model: '',
  price: '2000',
  promo_price: '',
  cost: '',
  min_stock: '2',
  sku: '',
  internal_code: '',
  status: 'ativo' as const,
  featured: false,
  condition: 'seminovo' as const,
}

describe('productSchema', () => {
  it('accepts a product without a promotional price', () => {
    const result = productSchema.safeParse(base)
    expect(result.success).toBe(true)
  })

  it('accepts a promo price lower than the regular price', () => {
    const result = productSchema.safeParse({ ...base, promo_price: '1599' })
    expect(result.success).toBe(true)
  })

  it('rejects a promo price equal to or higher than the regular price', () => {
    expect(productSchema.safeParse({ ...base, promo_price: '2000' }).success).toBe(false)
    expect(productSchema.safeParse({ ...base, promo_price: '2500' }).success).toBe(false)
  })

  it('rejects a slug with uppercase letters or spaces', () => {
    expect(productSchema.safeParse({ ...base, slug: 'iPhone 15' }).success).toBe(false)
  })

  it('has no stock field at all — the form can never carry a stock value, even if one is smuggled into FormData', () => {
    const result = productSchema.safeParse({ ...base, stock: '999' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect('stock' in result.data).toBe(false)
    }
  })
})
