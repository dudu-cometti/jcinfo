'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'

export type SettingsFormState = { error?: string; success?: boolean } | undefined

export async function updateSiteSettings(
  _prevState: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  await requireRole('admin')

  const whatsappNumber = String(formData.get('whatsapp_number') ?? '').replace(/\D/g, '')
  const siteName = String(formData.get('site_name') ?? '').trim()

  if (!siteName) {
    return { error: 'Informe o nome do site.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('site_settings').upsert([
    { key: 'whatsapp_number', value: whatsappNumber },
    { key: 'site_name', value: siteName },
  ])

  if (error) return { error: 'Erro ao salvar configurações.' }

  await supabase.rpc('log_audit', {
    p_action: 'configuracoes_alteradas',
    p_resource_table: 'site_settings',
    p_resource_id: null,
    p_data: { whatsapp_number: whatsappNumber, site_name: siteName },
  })

  revalidatePath('/admin/configuracoes')
  revalidatePath('/')
  return { success: true }
}
