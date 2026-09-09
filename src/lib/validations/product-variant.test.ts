import { describe, expect, it } from 'vitest'
import { productVariantSchema } from './product-variant'

const base = {
  color_name: 'Preto',
  color_hex: '',
  price: '1999',
  promo_price: '',
  sku: '',
  status: 'ativo' as const,
}

describe('productVariantSchema', () => {
  it('accepts a valid variant', () => {
    expect(productVariantSchema.safeParse(base).success).toBe(true)
  })

  it('has no stock field at all — the form can never carry a stock value, even if one is smuggled into FormData', () => {
    const result = productVariantSchema.safeParse({ ...base, stock: '999' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect('stock' in result.data).toBe(false)
    }
  })

  it('rejects a promo price equal to or higher than the regular price', () => {
    expect(productVariantSchema.safeParse({ ...base, promo_price: '1999' }).success).toBe(false)
  })
})
