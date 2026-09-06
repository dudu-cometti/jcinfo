import { createClient } from '@/lib/supabase/server'

export type SiteSettings = {
  whatsapp_number: string
  site_name: string
}

const DEFAULTS: SiteSettings = {
  whatsapp_number: '',
  site_name: process.env.NEXT_PUBLIC_SITE_NAME || 'JC Info',
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
