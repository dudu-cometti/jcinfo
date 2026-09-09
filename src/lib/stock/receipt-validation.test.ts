import { describe, expect, it } from 'vitest'
import { validateReceiptItems, InvalidReceiptItemError, type ProductVariantMap } from './receipt-validation'

const catalog: ProductVariantMap = {
  'product-a': ['variant-a1', 'variant-a2'],
  'product-b': ['variant-b1'],
  'product-c': [], // no color variants
}

describe('validateReceiptItems', () => {
  it('accepts a variant that genuinely belongs to its product', () => {
    expect(() =>
      validateReceiptItems([{ product_id: 'product-a', variant_id: 'variant-a1', quantity: 1, unit_cost: 10 }], catalog),
    ).not.toThrow()
  })

  it('rejects product A paired with a variant that belongs to product B', () => {
    expect(() =>
      validateReceiptItems([{ product_id: 'product-a', variant_id: 'variant-b1', quantity: 1, unit_cost: 10 }], catalog),
    ).toThrow(InvalidReceiptItemError)
  })

  it('rejects a product with color variants when none is selected', () => {
    expect(() =>
      validateReceiptItems([{ product_id: 'product-a', variant_id: null, quantity: 1, unit_cost: 10 }], catalog),
    ).toThrow(InvalidReceiptItemError)
  })

  it('rejects a variant informed for a product that has no color variants', () => {
    expect(() =>
      validateReceiptItems([{ product_id: 'product-c', variant_id: 'variant-a1', quantity: 1, unit_cost: 10 }], catalog),
    ).toThrow(InvalidReceiptItemError)
  })

  it('accepts a plain product without variants and no variant_id', () => {
    expect(() =>
      validateReceiptItems([{ product_id: 'product-c', variant_id: null, quantity: 1, unit_cost: 10 }], catalog),
    ).not.toThrow()
  })

  it('rejects a variant id that does not exist anywhere in the catalog', () => {
    expect(() =>
      validateReceiptItems([{ product_id: 'product-b', variant_id: 'ghost-variant', quantity: 1, unit_cost: 10 }], catalog),
    ).toThrow(InvalidReceiptItemError)
  })
})
