import { describe, expect, it } from 'vitest'
import { canManageOrcamento, canEditOrcamento, canConvertOrcamento, isOrcamentoExpired } from './permissions'

const sellerA = { id: 'seller-a', role: 'vendedor' as const }
const sellerB = { id: 'seller-b', role: 'vendedor' as const }
const admin = { id: 'admin-1', role: 'admin' as const }

const draft = { seller_id: 'seller-a', status: 'rascunho' as const, expires_at: null }
const sent = { seller_id: 'seller-a', status: 'enviado' as const, expires_at: '2999-01-01T00:00:00Z' }
const expiredSent = { seller_id: 'seller-a', status: 'enviado' as const, expires_at: '2000-01-01T00:00:00Z' }
const converted = { seller_id: 'seller-a', status: 'convertido' as const, expires_at: null }

describe('canManageOrcamento', () => {
  it('lets the owning seller manage their own orçamento', () => {
    expect(canManageOrcamento(sellerA, draft)).toBe(true)
  })

  it('blocks a different seller from managing someone else\'s orçamento', () => {
    expect(canManageOrcamento(sellerB, draft)).toBe(false)
  })

  it('lets admin manage any orçamento', () => {
    expect(canManageOrcamento(admin, draft)).toBe(true)
  })
})

describe('canEditOrcamento', () => {
  it('blocks editing a converted orçamento even for its own seller', () => {
    expect(canEditOrcamento(sellerA, converted)).toBe(false)
  })

  it('allows editing a draft owned by the seller', () => {
    expect(canEditOrcamento(sellerA, draft)).toBe(true)
  })

  it('admin can still edit a converted orçamento (audit/correction only per RLS)', () => {
    expect(canEditOrcamento(admin, converted)).toBe(true)
  })
})

describe('isOrcamentoExpired', () => {
  it('treats a null expires_at as never expired', () => {
    expect(isOrcamentoExpired(draft)).toBe(false)
  })

  it('detects an expired orçamento', () => {
    expect(isOrcamentoExpired(expiredSent)).toBe(true)
  })
})

describe('canConvertOrcamento', () => {
  it('allows converting an enviado orçamento owned by the seller', () => {
    expect(canConvertOrcamento(sellerA, sent)).toBe(true)
  })

  it('blocks converting another seller\'s orçamento', () => {
    expect(canConvertOrcamento(sellerB, sent)).toBe(false)
  })

  it('blocks converting a rascunho (must be enviado/aprovado first)', () => {
    expect(canConvertOrcamento(sellerA, draft)).toBe(false)
  })

  it('blocks converting an expired orçamento even though status is still enviado', () => {
    expect(canConvertOrcamento(sellerA, expiredSent)).toBe(false)
  })

  it('admin can convert any eligible orçamento', () => {
    expect(canConvertOrcamento(admin, sent)).toBe(true)
  })
})
