import { describe, expect, it } from 'vitest'
import { createOrcamentoSchema, parseCreateOrcamentoFormData } from './orcamento'

const validItems = JSON.stringify([{ product_id: '11111111-1111-4111-8111-111111111111', quantity: 2 }])

describe('createOrcamentoSchema', () => {
  it('accepts a well-formed orçamento payload', () => {
    const result = createOrcamentoSchema.safeParse({
      customer_id: '22222222-2222-4222-8222-222222222222',
      items: validItems,
      discount: 0,
      freight_value: 140,
      machine_id: '33333333-3333-4333-8333-333333333333',
      card_brand: null,
      payment_method: 'credito',
      installments: 6,
      validity_days: 3,
      notes: '',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.items).toHaveLength(1)
      expect(result.data.items[0].quantity).toBe(2)
    }
  })

  it('surfaces a clean error when the items JSON is malformed instead of throwing', () => {
    const result = createOrcamentoSchema.safeParse({
      customer_id: '22222222-2222-4222-8222-222222222222',
      items: '{not valid json',
      discount: 0,
      freight_value: 0,
      machine_id: '33333333-3333-4333-8333-333333333333',
      card_brand: null,
      payment_method: 'pix',
      installments: 1,
      validity_days: 3,
      notes: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an empty items array', () => {
    const result = createOrcamentoSchema.safeParse({
      customer_id: '22222222-2222-4222-8222-222222222222',
      items: '[]',
      discount: 0,
      freight_value: 0,
      machine_id: '33333333-3333-4333-8333-333333333333',
      card_brand: null,
      payment_method: 'pix',
      installments: 1,
      validity_days: 3,
      notes: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects a negative discount', () => {
    const result = createOrcamentoSchema.safeParse({
      customer_id: '22222222-2222-4222-8222-222222222222',
      items: validItems,
      discount: -10,
      freight_value: 0,
      machine_id: '33333333-3333-4333-8333-333333333333',
      card_brand: null,
      payment_method: 'pix',
      installments: 1,
      validity_days: 3,
      notes: '',
    })
    expect(result.success).toBe(false)
  })

  it('parseCreateOrcamentoFormData reads from a FormData instance', () => {
    const fd = new FormData()
    fd.set('customer_id', '22222222-2222-4222-8222-222222222222')
    fd.set('items', validItems)
    fd.set('machine_id', '33333333-3333-4333-8333-333333333333')
    fd.set('payment_method', 'debito')
    const result = parseCreateOrcamentoFormData(fd)
    expect(result.success).toBe(true)
  })
})
