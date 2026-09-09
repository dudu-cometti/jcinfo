import { describe, expect, it } from 'vitest'
import { calculateFees, resolveRateRule, FeeRuleNotFoundError, type RateRuleInput } from './fees'

const infinitePayRules: RateRuleInput[] = [
  { id: 'r-deb', machineId: 'infinitepay', method: 'debito', installments: 1, percentage: 1.99, fixedValue: 0, cardBrand: null },
  { id: 'r-cred-1', machineId: 'infinitepay', method: 'credito', installments: 1, percentage: 3.5, fixedValue: 0, cardBrand: null },
  { id: 'r-cred-3', machineId: 'infinitepay', method: 'credito', installments: 3, percentage: 6.5, fixedValue: 0, cardBrand: null },
  { id: 'r-cred-7', machineId: 'infinitepay', method: 'credito', installments: 7, percentage: 10.5, fixedValue: 1.5, cardBrand: null },
  { id: 'r-cred-12', machineId: 'infinitepay', method: 'credito', installments: 12, percentage: 15.9, fixedValue: 0, cardBrand: null },
]

const secondMachineRules: RateRuleInput[] = [
  { id: 'r2-cred-13', machineId: 'segunda', method: 'credito', installments: 13, percentage: 18, fixedValue: 0, cardBrand: null },
  { id: 'r2-cred-18', machineId: 'segunda', method: 'credito', installments: 18, percentage: 22, fixedValue: 0, cardBrand: null },
]

describe('calculateFees', () => {
  it('pix/dinheiro charge exactly the base value, no fee', () => {
    const result = calculateFees({
      subtotal: 1000, discount: 100, freight: 140, method: 'pix', installments: 1,
      machineId: 'infinitepay', rules: infinitePayRules,
    })
    expect(result.baseValue).toBe(1040)
    expect(result.finalValue).toBe(1040)
    expect(result.installmentCount).toBe(1)
    expect(result.installmentValue).toBe(1040)
    expect(result.lastInstallmentValue).toBe(1040)
    expect(result.percentageApplied).toBe(0)
  })

  it('folds freight into the base value before applying the fee', () => {
    const withFreight = calculateFees({
      subtotal: 1000, discount: 0, freight: 140, method: 'debito', installments: 1,
      machineId: 'infinitepay', rules: infinitePayRules,
    })
    const withoutFreight = calculateFees({
      subtotal: 1000, discount: 0, freight: 0, method: 'debito', installments: 1,
      machineId: 'infinitepay', rules: infinitePayRules,
    })
    expect(withFreight.baseValue).toBe(1140)
    expect(withFreight.finalValue).toBeGreaterThan(withoutFreight.finalValue)
  })

  it('applies the debito percentage using the pass-through formula', () => {
    const result = calculateFees({
      subtotal: 100, discount: 0, freight: 0, method: 'debito', installments: 1,
      machineId: 'infinitepay', rules: infinitePayRules,
    })
    expect(result.baseValue).toBe(100)
    // (100 + 0) / (1 - 0.0199) = 102.0326... -> 102.03
    expect(result.finalValue).toBe(102.03)
    expect(result.installmentValue).toBe(102.03)
    expect(result.lastInstallmentValue).toBe(102.03)
  })

  it('credito a vista (1x) has installmentValue === lastInstallmentValue === finalValue', () => {
    const result = calculateFees({
      subtotal: 200, discount: 0, freight: 0, method: 'credito', installments: 1,
      machineId: 'infinitepay', rules: infinitePayRules,
    })
    expect(result.installmentCount).toBe(1)
    expect(result.installmentValue).toBe(result.finalValue)
    expect(result.lastInstallmentValue).toBe(result.finalValue)
  })

  it('resolves the correct rule for credito 3x on InfinitePay', () => {
    const result = calculateFees({
      subtotal: 300, discount: 0, freight: 0, method: 'credito', installments: 3,
      machineId: 'infinitepay', rules: infinitePayRules,
    })
    expect(result.ruleId).toBe('r-cred-3')
    expect(result.percentageApplied).toBe(6.5)
  })

  it('resolves credito 7x with a fixed fee component', () => {
    const result = calculateFees({
      subtotal: 500, discount: 0, freight: 0, method: 'credito', installments: 7,
      machineId: 'infinitepay', rules: infinitePayRules,
    })
    expect(result.ruleId).toBe('r-cred-7')
    expect(result.fixedValueApplied).toBe(1.5)
  })

  it('rounds every installment down and dumps the exact remainder into the last one', () => {
    const result = calculateFees({
      subtotal: 100, discount: 0, freight: 0, method: 'credito', installments: 3,
      machineId: 'infinitepay', rules: infinitePayRules,
    })
    const sum = result.installmentValue * (result.installmentCount - 1) + result.lastInstallmentValue
    expect(Math.round(sum * 100) / 100).toBe(result.finalValue)
    expect(result.lastInstallmentValue).toBeGreaterThanOrEqual(result.installmentValue)
  })

  it('supports the second machine range (13x-18x) independently from InfinitePay', () => {
    const result = calculateFees({
      subtotal: 1000, discount: 0, freight: 0, method: 'credito', installments: 13,
      machineId: 'segunda', rules: secondMachineRules,
    })
    expect(result.ruleId).toBe('r2-cred-13')
    expect(result.installmentCount).toBe(13)
  })

  it('throws FeeRuleNotFoundError for an installment count unavailable on that machine', () => {
    expect(() =>
      calculateFees({
        subtotal: 1000, discount: 0, freight: 0, method: 'credito', installments: 13,
        machineId: 'infinitepay', rules: infinitePayRules,
      }),
    ).toThrow(FeeRuleNotFoundError)
  })

  it('calculateFees resolves different totals for different card brands on the same purchase', () => {
    const rules: RateRuleInput[] = [
      { id: 'generic', machineId: 'infinitepay', method: 'credito', installments: 1, percentage: 5, fixedValue: 0, cardBrand: null },
      { id: 'visa', machineId: 'infinitepay', method: 'credito', installments: 1, percentage: 2, fixedValue: 0, cardBrand: 'Visa' },
    ]
    const withVisa = calculateFees({
      subtotal: 1000, discount: 0, freight: 0, method: 'credito', installments: 1,
      machineId: 'infinitepay', cardBrand: 'Visa', rules,
    })
    const withoutBrand = calculateFees({
      subtotal: 1000, discount: 0, freight: 0, method: 'credito', installments: 1,
      machineId: 'infinitepay', cardBrand: null, rules,
    })
    expect(withVisa.finalValue).not.toBe(withoutBrand.finalValue)
    expect(withVisa.ruleId).toBe('visa')
    expect(withoutBrand.ruleId).toBe('generic')
  })

  it('never lets discount push the base value negative in practice (caller must clamp, but formula stays exact)', () => {
    const result = calculateFees({
      subtotal: 100, discount: 100, freight: 0, method: 'pix', installments: 1,
      machineId: 'infinitepay', rules: infinitePayRules,
    })
    expect(result.baseValue).toBe(0)
  })
})

describe('resolveRateRule', () => {
  it('ignores the requested installment count for non-credito methods', () => {
    const rule = resolveRateRule(infinitePayRules, 'infinitepay', 'debito', 5)
    expect(rule?.id).toBe('r-deb')
  })

  it('returns null when no rule matches', () => {
    expect(resolveRateRule(infinitePayRules, 'infinitepay', 'credito', 4)).toBeNull()
  })

  const brandRules: RateRuleInput[] = [
    { id: 'generic', machineId: 'm1', method: 'credito', installments: 1, percentage: 5, fixedValue: 0, cardBrand: null },
    { id: 'visa', machineId: 'm1', method: 'credito', installments: 1, percentage: 3, fixedValue: 0, cardBrand: 'Visa' },
    { id: 'master', machineId: 'm1', method: 'credito', installments: 1, percentage: 4, fixedValue: 0, cardBrand: 'Master' },
  ]

  it('prefers the exact-brand rule over the generic one when a brand is given', () => {
    expect(resolveRateRule(brandRules, 'm1', 'credito', 1, 'Visa')?.id).toBe('visa')
    expect(resolveRateRule(brandRules, 'm1', 'credito', 1, 'Master')?.id).toBe('master')
  })

  it('different brands resolve to different rules (never picks the first match blindly)', () => {
    const visa = resolveRateRule(brandRules, 'm1', 'credito', 1, 'Visa')
    const master = resolveRateRule(brandRules, 'm1', 'credito', 1, 'Master')
    expect(visa?.percentage).not.toBe(master?.percentage)
  })

  it('falls back to the "qualquer bandeira" rule only when no brand-specific rule exists', () => {
    expect(resolveRateRule(brandRules, 'm1', 'credito', 1, 'Elo')?.id).toBe('generic')
  })

  it('uses the generic rule when no brand was informed at all', () => {
    expect(resolveRateRule(brandRules, 'm1', 'credito', 1, null)?.id).toBe('generic')
    expect(resolveRateRule(brandRules, 'm1', 'credito', 1)?.id).toBe('generic')
  })

  it('returns null (not a random pick) when only brand-specific rules exist and none match', () => {
    const onlyBranded: RateRuleInput[] = [
      { id: 'visa', machineId: 'm1', method: 'credito', installments: 1, percentage: 3, fixedValue: 0, cardBrand: 'Visa' },
    ]
    expect(resolveRateRule(onlyBranded, 'm1', 'credito', 1, 'Master')).toBeNull()
  })
})
