export type PaymentMethod = 'pix' | 'dinheiro' | 'debito' | 'credito'

export type RateRuleInput = {
  id: string
  machineId: string
  method: PaymentMethod
  installments: number
  percentage: number
  fixedValue: number | null
  cardBrand: string | null
}

export type FeeCalcInput = {
  subtotal: number
  discount: number
  freight: number
  method: PaymentMethod
  /** Ignored for pix/dinheiro/debito — treated as 1. */
  installments: number
  machineId: string
  /** Optional — null/omitted means "no brand selected", which only ever matches a "qualquer bandeira" (cardBrand: null) rule. */
  cardBrand?: string | null
  /** The active rule set for the chosen machine (already filtered to status='ativa' + period by the caller). */
  rules: RateRuleInput[]
}

export type FeeCalcResult = {
  baseValue: number
  finalValue: number
  installmentCount: number
  /** Value of every installment except the last. */
  installmentValue: number
  /** installmentValue + the rounding remainder, so installmentValue*(n-1) + lastInstallmentValue === finalValue exactly. */
  lastInstallmentValue: number
  percentageApplied: number
  fixedValueApplied: number
  ruleId: string | null
}

export class FeeRuleNotFoundError extends Error {}

/** Rounds to the nearest centavo. */
function roundCentavos(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * Resolves the applicable rule for a machine/method/installments/bandeira
 * combination. NEVER just returns the first match: a rule tied to a
 * specific `cardBrand` is always preferred over a "qualquer bandeira"
 * (cardBrand: null) rule when the caller specified a brand; the generic
 * rule is only used as an explicit fallback when either no brand was
 * given, or no brand-specific rule exists for the one given.
 */
export function resolveRateRule(
  rules: RateRuleInput[],
  machineId: string,
  method: PaymentMethod,
  installments: number,
  cardBrand?: string | null,
): RateRuleInput | null {
  const wantInstallments = method === 'credito' ? installments : 1
  const candidates = rules.filter(
    (r) => r.machineId === machineId && r.method === method && r.installments === wantInstallments,
  )

  if (cardBrand) {
    const exact = candidates.find((r) => r.cardBrand === cardBrand)
    if (exact) return exact
  }

  return candidates.find((r) => !r.cardBrand) ?? null
}

/**
 * Server-side only. valor_base = subtotal - desconto + frete;
 * valor_cobrado = (valor_base + taxa_fixa) / (1 - taxa_percentual / 100)
 * for débito/crédito. Pix/dinheiro pay exactly valor_base. The rounding
 * remainder is absorbed entirely by the last installment so the parcelas
 * always sum to the exact total.
 */
export function calculateFees(input: FeeCalcInput): FeeCalcResult {
  const baseValue = roundCentavos(input.subtotal - input.discount + input.freight)

  if (input.method === 'pix' || input.method === 'dinheiro') {
    return {
      baseValue,
      finalValue: baseValue,
      installmentCount: 1,
      installmentValue: baseValue,
      lastInstallmentValue: baseValue,
      percentageApplied: 0,
      fixedValueApplied: 0,
      ruleId: null,
    }
  }

  const installmentCount = input.method === 'credito' ? Math.max(1, Math.trunc(input.installments)) : 1
  const rule = resolveRateRule(input.rules, input.machineId, input.method, installmentCount, input.cardBrand)
  if (!rule) {
    throw new FeeRuleNotFoundError(`Nenhuma taxa ativa para ${input.method} ${installmentCount}x nesta máquina.`)
  }

  const fixed = rule.fixedValue ?? 0
  const rawFinal = (baseValue + fixed) / (1 - rule.percentage / 100)
  const finalValue = roundCentavos(rawFinal)

  const installmentValue = Math.floor((finalValue / installmentCount) * 100) / 100
  const lastInstallmentValue = roundCentavos(finalValue - installmentValue * (installmentCount - 1))

  return {
    baseValue,
    finalValue,
    installmentCount,
    installmentValue,
    lastInstallmentValue,
    percentageApplied: rule.percentage,
    fixedValueApplied: fixed,
    ruleId: rule.id,
  }
}
