'use server'

import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { createDbRateProvider } from '@/lib/payments/db-provider'
import { calculateFees, FeeRuleNotFoundError, type PaymentMethod } from '@/lib/payments/fees'

export type PreviewFeesInput = {
  subtotal: number
  discount: number
  freight: number
  machineId: string
  method: PaymentMethod
  installments: number
  cardBrand?: string | null
}

export type PreviewFeesState =
  | { error: string }
  | {
      baseValue: number
      finalValue: number
      installmentCount: number
      installmentValue: number
      lastInstallmentValue: number
      percentageApplied: number
      fixedValueApplied: number
    }

/**
 * The "cálculo server-side" the spec requires: the vendedor only ever sends
 * WHAT to compute (base inputs + which machine/method/installments), never
 * a fee or total — this fetches the currently active rules from the
 * database and runs the pure calculateFees() here, on the server.
 */
export async function previewOrcamentoFees(input: PreviewFeesInput): Promise<PreviewFeesState> {
  await requireRole('admin', 'vendedor')

  if (input.subtotal < 0 || input.discount < 0 || input.freight < 0) {
    return { error: 'Valores inválidos.' }
  }

  const supabase = await createClient()
  const provider = createDbRateProvider(supabase)
  const rules = await provider.getActiveRules(input.machineId, new Date())

  try {
    const result = calculateFees({
      subtotal: input.subtotal,
      discount: input.discount,
      freight: input.freight,
      method: input.method,
      installments: input.installments,
      machineId: input.machineId,
      cardBrand: input.cardBrand,
      rules,
    })
    return {
      baseValue: result.baseValue,
      finalValue: result.finalValue,
      installmentCount: result.installmentCount,
      installmentValue: result.installmentValue,
      lastInstallmentValue: result.lastInstallmentValue,
      percentageApplied: result.percentageApplied,
      fixedValueApplied: result.fixedValueApplied,
    }
  } catch (error) {
    if (error instanceof FeeRuleNotFoundError) {
      return { error: error.message }
    }
    return { error: 'Erro ao calcular a taxa.' }
  }
}
