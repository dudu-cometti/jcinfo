import 'server-only'
import type { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import type { RateRuleInput, PaymentMethod } from './fees'
import type { PaymentRateProvider } from './provider'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>
type RateRuleRow = Database['public']['Tables']['payment_rate_rules']['Row']

function toRateRuleInput(row: RateRuleRow): RateRuleInput {
  return {
    id: row.id,
    machineId: row.machine_id,
    method: row.method as PaymentMethod,
    installments: row.installments,
    percentage: row.percentage,
    fixedValue: row.fixed_value,
    cardBrand: row.card_brand,
  }
}

/**
 * The only provider implementation today: reads `payment_rate_rules` from
 * the database. Used for BOTH `provider_key` values currently seeded
 * ('infinitepay' and 'generic') — the admin-editable rules table is the
 * single source of truth for every machine until a real InfinitePay API
 * becomes available.
 */
export function createDbRateProvider(supabase: SupabaseServerClient): PaymentRateProvider {
  return {
    providerKey: 'db',
    async getActiveRules(machineId, asOf) {
      const { data } = await supabase
        .from('payment_rate_rules')
        .select(
          'id, machine_id, method, installments, percentage, fixed_value, card_brand, period_start, period_end, status',
        )
        .eq('machine_id', machineId)
        .eq('status', 'ativa')

      const asOfDate = asOf.toISOString().slice(0, 10)

      return (data ?? [])
        .filter(
          (r) =>
            (!r.period_start || r.period_start <= asOfDate) && (!r.period_end || r.period_end >= asOfDate),
        )
        .map((r) => toRateRuleInput(r as RateRuleRow))
    },
  }
}

/**
 * Resolves the provider for a machine's `provider_key`. Both known keys
 * resolve to the DB-backed provider today. A future real InfinitePay
 * integration would add a case here (e.g. `createInfinitePayApiProvider`)
 * without changing anything that calls `resolveProvider`.
 */
export function resolveProvider(_providerKey: string, supabase: SupabaseServerClient): PaymentRateProvider {
  return createDbRateProvider(supabase)
}
