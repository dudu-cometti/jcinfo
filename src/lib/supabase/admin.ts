import 'server-only'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Privileged client that bypasses RLS using the service role key.
 * NEVER import this file from a Client Component or expose its output to the browser.
 * Use only for trusted server-side operations (e.g. cross-tenant reports, webhooks).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )
}
