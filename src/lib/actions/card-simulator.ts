'use server'

import { createClient } from '@/lib/supabase/server'
import { checkSimulatorRateLimit, getClientIp } from '@/lib/security/rate-limit'

export type SimulateCardFeeState =
  | { error: string }
  | {
      machineName: string
      installments: number
      percentageApplied: number
      fixedValueApplied: number
      finalValue: number
      installmentValue: number
      lastInstallmentValue: number
    }

/**
 * Deliberately public — no requireRole here, this is the one page in the
 * app that must work with no login. The actual calculation (which machine
 * covers this installment count, which rate rule applies) happens entirely
 * inside simulate_card_fee() (SECURITY DEFINER); this action never reads or
 * trusts a fee/total from the client, only value + installment count.
 */
export async function simulateCardFee(value: number, installments: number): Promise<SimulateCardFeeState> {
  const ip = await getClientIp()
  if (!(await checkSimulatorRateLimit(ip))) {
    return { error: 'Muitas tentativas. Tente novamente em instantes.' }
  }

  if (!Number.isFinite(value) || value <= 0) {
    return { error: 'Informe um valor válido.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('simulate_card_fee', {
    p_value: value,
    p_installments: installments,
  })

  if (error || !data?.[0]) {
    return {
      error: error?.message.includes('no machine covers') || error?.message.includes('no active rate rule')
        ? 'Não há taxa configurada para essa quantidade de parcelas.'
        : 'Erro ao calcular a simulação.',
    }
  }

  const row = data[0]
  return {
    machineName: row.machine_name,
    installments: row.installments,
    percentageApplied: row.percentage_applied,
    fixedValueApplied: row.fixed_value_applied,
    finalValue: row.final_value,
    installmentValue: row.installment_value,
    lastInstallmentValue: row.last_installment_value,
  }
}

export async function getSimulatorInstallmentBounds(): Promise<{ min: number; max: number }> {
  const supabase = await createClient()
  const { data } = await supabase.rpc('simulator_installment_bounds')
  const row = data?.[0]
  return { min: row?.min_installments ?? 1, max: row?.max_installments ?? 12 }
}
