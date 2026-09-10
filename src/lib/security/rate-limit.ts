import 'server-only'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function getClientIp(): Promise<string> {
  const headersList = await headers()
  return headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
}

/**
 * Each public flow gets its own RPC with the bucket prefix and max/window
 * hardcoded server-side (see supabase/migrations/20260101000049_specific_rate_limiters.sql).
 * There is no generic "checkRateLimit(bucketKey, max, window)" anymore —
 * that shape let the caller pick its own limits, which isn't a rate limit
 * at all. Only the IP is ever passed, never a limit/window.
 */
async function callRateLimitRpc(
  fn:
    | 'check_lead_rate_limit'
    | 'check_preorder_rate_limit'
    | 'check_raffle_rate_limit'
    | 'check_orcamento_image_rate_limit'
    | 'check_simulator_rate_limit',
  ip: string,
): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc(fn, { p_ip: ip })
  if (error) return true
  return data === true
}

export function checkLeadRateLimit(ip: string): Promise<boolean> {
  return callRateLimitRpc('check_lead_rate_limit', ip)
}

export function checkPreorderRateLimit(ip: string): Promise<boolean> {
  return callRateLimitRpc('check_preorder_rate_limit', ip)
}

export function checkRaffleRateLimit(ip: string): Promise<boolean> {
  return callRateLimitRpc('check_raffle_rate_limit', ip)
}

export function checkOrcamentoImageRateLimit(ip: string): Promise<boolean> {
  return callRateLimitRpc('check_orcamento_image_rate_limit', ip)
}

export function checkSimulatorRateLimit(ip: string): Promise<boolean> {
  return callRateLimitRpc('check_simulator_rate_limit', ip)
}
