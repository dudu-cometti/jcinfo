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
  const freightDefaultValue = Number(formData.get('freight_default_value') ?? 0)
  const freightMaxValue = Number(formData.get('freight_max_value') ?? 0)
  const orcamentoValidityDays = Number(formData.get('orcamento_default_validity_days') ?? 3)
  const storeWarrantyText = String(formData.get('store_warranty_text') ?? '').trim()
  const storeAddress = String(formData.get('store_address') ?? '').trim()

  if (!siteName) {
    return { error: 'Informe o nome do site.' }
  }
  if (freightDefaultValue < 0 || freightMaxValue < 0) {
    return { error: 'Valores de frete não podem ser negativos.' }
  }
  if (orcamentoValidityDays < 1) {
    return { error: 'A validade do orçamento deve ser de ao menos 1 dia.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('site_settings').upsert([
    { key: 'whatsapp_number', value: whatsappNumber },
    { key: 'site_name', value: siteName },
    { key: 'freight_default_value', value: freightDefaultValue },
    { key: 'freight_max_value', value: freightMaxValue },
    { key: 'orcamento_default_validity_days', value: orcamentoValidityDays },
    { key: 'store_warranty_text', value: storeWarrantyText },
    { key: 'store_address', value: storeAddress },
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
