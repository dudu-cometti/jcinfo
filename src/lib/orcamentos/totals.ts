import { calculateFees, type FeeCalcResult, type PaymentMethod, type RateRuleInput } from '@/lib/payments/fees'

export type OrcamentoLineInput = { unitPrice: number; quantity: number }

export type OrcamentoTotalsInput = {
  items: OrcamentoLineInput[]
  discount: number
  freight: number
  method: PaymentMethod
  installments: number
  machineId: string
  rules: RateRuleInput[]
}

export type OrcamentoTotals = FeeCalcResult & { subtotal: number; discount: number }

/**
 * Pure preview/summary builder — mirrors src/lib/sales/totals.ts's split:
 * this has no DB access and is fully unit-testable. The authoritative
 * calculation for a real conversion still happens server-side, reading
 * live rate rules (see previewOrcamentoFees in
 * src/lib/actions/orcamento-fees.ts) and, at conversion time, inside
 * convert_orcamento_to_sale().
 */
export function computeOrcamentoTotals(input: OrcamentoTotalsInput): OrcamentoTotals {
  const subtotal = input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const safeDiscount = Math.max(0, Math.min(input.discount, subtotal))

  const fees = calculateFees({
    subtotal,
    discount: safeDiscount,
    freight: Math.max(0, input.freight),
    method: input.method,
    installments: input.installments,
    machineId: input.machineId,
    rules: input.rules,
  })

  return { ...fees, subtotal, discount: safeDiscount }
}
