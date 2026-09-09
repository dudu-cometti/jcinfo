import type { RateRuleInput } from './fees'

/**
 * Contract for resolving a machine's active fee rules. The only shipped
 * implementation today reads `payment_rate_rules` (see db-provider.ts) —
 * there is no public InfinitePay API to query account-specific rates
 * against. A future official integration (once InfinitePay provides
 * credentials/documentation) implements this exact interface with a real
 * API call instead of the DB read; no scraping or login automation.
 */
export type PaymentRateProvider = {
  readonly providerKey: string
  getActiveRules(machineId: string, asOf: Date): Promise<RateRuleInput[]>
}
