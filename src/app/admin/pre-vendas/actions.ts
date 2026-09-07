'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import {
  parsePreorderCampaignFormData,
  type PreorderCampaignFormState,
} from '@/lib/validations/preorder'

export async function createPreorderCampaign(
  _prevState: PreorderCampaignFormState,
  formData: FormData,
): Promise<PreorderCampaignFormState> {
  await requireRole('admin')

  const validated = parsePreorderCampaignFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('preorder_campaigns')
    .insert(validated.data)
    .select('id')
    .single()

  if (error) {
    return {
      error: error.code === '23505' ? 'Já existe uma pré-venda com esse slug.' : 'Erro ao criar pré-venda.',
    }
  }

  await supabase.rpc('log_audit', {
    p_action: 'pre_venda_criada',
    p_resource_table: 'preorder_campaigns',
    p_resource_id: data.id,
    p_data: validated.data,
  })

  revalidatePath('/admin/pre-vendas')
  redirect(`/admin/pre-vendas/${data.id}`)
}

export async function updatePreorderCampaign(
  campaignId: string,
  _prevState: PreorderCampaignFormState,
  formData: FormData,
): Promise<PreorderCampaignFormState> {
  await requireRole('admin')

  const validated = parsePreorderCampaignFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('preorder_campaigns').update(validated.data).eq('id', campaignId)

  if (error) {
    return {
      error: error.code === '23505' ? 'Já existe uma pré-venda com esse slug.' : 'Erro ao salvar pré-venda.',
    }
  }

  await supabase.rpc('log_audit', {
    p_action: 'pre_venda_editada',
    p_resource_table: 'preorder_campaigns',
    p_resource_id: campaignId,
    p_data: validated.data,
  })

  revalidatePath('/admin/pre-vendas')
  revalidatePath(`/admin/pre-vendas/${campaignId}`)
  return undefined
}

export async function deletePreorderCampaign(campaignId: string) {
  await requireRole('admin')

  const supabase = await createClient()
  const { error } = await supabase.from('preorder_campaigns').delete().eq('id', campaignId)
  if (error) return

  await supabase.rpc('log_audit', {
    p_action: 'pre_venda_excluida',
    p_resource_table: 'preorder_campaigns',
    p_resource_id: campaignId,
  })
  revalidatePath('/admin/pre-vendas')
}

export async function toggleSignupConverted(signupId: string, converted: boolean) {
  await requireRole('admin')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('preorder_signups')
    .update({ converted })
    .eq('id', signupId)
    .select('campaign_id')
    .single()
  if (error || !data) return

  await supabase.rpc('log_audit', {
    p_action: converted ? 'pre_venda_inscricao_convertida' : 'pre_venda_inscricao_revertida',
    p_resource_table: 'preorder_signups',
    p_resource_id: signupId,
  })
  revalidatePath(`/admin/pre-vendas/${data.campaign_id}`)
}
