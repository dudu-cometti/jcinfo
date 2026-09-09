import { createClient } from '@/lib/supabase/server'

export type SiteSettings = {
  whatsapp_number: string
  site_name: string
  freight_default_value: number
  freight_max_value: number
  orcamento_default_validity_days: number
  store_warranty_text: string
  store_address: string
}

const DEFAULTS: SiteSettings = {
  whatsapp_number: '',
  site_name: process.env.NEXT_PUBLIC_SITE_NAME || 'JC Info',
  freight_default_value: 140,
  freight_max_value: 300,
  orcamento_default_validity_days: 3,
  store_warranty_text: '',
  store_address: '',
}

/** Reads public.site_settings (readable by anon) and merges with defaults. */
export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = await createClient()
  const { data } = await supabase.from('site_settings').select('key, value')

  const settings = { ...DEFAULTS }
  for (const row of data ?? []) {
    if (row.key in settings) {
      ;(settings as Record<string, unknown>)[row.key] = row.value
    }
  }
  return settings
}
