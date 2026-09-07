import { describe, expect, it } from 'vitest'
import { formatBRL, normalizePhone, normalizeCpf, isValidCpf, slugify } from './utils'

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

describe('isValidCpf', () => {
  it('accepts a known-valid CPF, formatted or as plain digits', () => {
    expect(isValidCpf('111.444.777-35')).toBe(true)
    expect(isValidCpf('11144477735')).toBe(true)
  })

  it('rejects a CPF with a wrong check digit', () => {
    expect(isValidCpf('111.444.777-36')).toBe(false)
  })

  it('rejects all-same-digit sequences (a common typo/fake pattern)', () => {
    expect(isValidCpf('111.111.111-11')).toBe(false)
    expect(isValidCpf('00000000000')).toBe(false)
  })

  it('rejects the wrong number of digits', () => {
    expect(isValidCpf('123')).toBe(false)
    expect(isValidCpf('123456789012')).toBe(false)
  })
})

describe('normalizeCpf', () => {
  it('strips punctuation so different formatting dedupes to the same CPF', () => {
    expect(normalizeCpf('111.444.777-35')).toBe('11144477735')
  })
})

describe('formatBRL', () => {
  it('formats as Brazilian currency', () => {
    expect(formatBRL(1599)).toContain('1.599,00')
    expect(formatBRL(0)).toContain('0,00')
  })
})
