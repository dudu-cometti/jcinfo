import { describe, expect, it } from 'vitest'
import { formatBRL, normalizePhone, slugify } from './utils'

describe('normalizePhone', () => {
  it('strips formatting so different masks dedupe to the same phone', () => {
    expect(normalizePhone('(11) 99999-9999')).toBe('11999999999')
    expect(normalizePhone('11999999999')).toBe('11999999999')
    expect(normalizePhone('+55 11 99999-9999')).toBe('5511999999999')
  })
})

describe('slugify', () => {
  it('lowercases, strips accents and punctuation, and hyphenates', () => {
    expect(slugify('iPhone 15 Pró Máx')).toBe('iphone-15-pro-max')
    expect(slugify('  Fone JBL — Tune 510BT  ')).toBe('fone-jbl-tune-510bt')
    expect(slugify('Xiaomi/Redmi Note 13')).toBe('xiaomi-redmi-note-13')
  })
})

describe('formatBRL', () => {
  it('formats as Brazilian currency', () => {
    expect(formatBRL(1599)).toContain('1.599,00')
    expect(formatBRL(0)).toContain('0,00')
  })
})
