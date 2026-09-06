'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { parseCampaignFormData, type CampaignFormState } from '@/lib/validations/campaign'

function getRewardIds(formData: FormData) {
  return formData.getAll('reward_ids').map(String).filter(Boolean)
}

async function syncCampaignRewards(
  supabase: Awaited<ReturnType<typeof createClient>>,
  campaignId: string,
  rewardIds: string[],
) {
  await supabase.from('campaign_rewards').delete().eq('campaign_id', campaignId)
  if (rewardIds.length > 0) {
    await supabase
      .from('campaign_rewards')
      .insert(rewardIds.map((rewardId) => ({ campaign_id: campaignId, reward_id: rewardId })))
  }
}

export async function createCampaign(
  _prevState: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  await requireRole('admin')

  const validated = parseCampaignFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from('point_campaigns').insert(validated.data).select('id').single()
  if (error) return { error: 'Erro ao criar campanha.' }

  await syncCampaignRewards(supabase, data.id, getRewardIds(formData))

  await supabase.rpc('log_audit', {
    p_action: 'campanha_criada',
    p_resource_table: 'point_campaigns',
    p_resource_id: data.id,
    p_data: validated.data,
  })

  revalidatePath('/admin/campanhas')
  redirect('/admin/campanhas')
}

export async function updateCampaign(
  campaignId: string,
  _prevState: CampaignFormState,
  formData: FormData,
): Promise<CampaignFormState> {
  await requireRole('admin')

  const validated = parseCampaignFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('point_campaigns').update(validated.data).eq('id', campaignId)
  if (error) return { error: 'Erro ao salvar campanha.' }

  await syncCampaignRewards(supabase, campaignId, getRewardIds(formData))

  await supabase.rpc('log_audit', {
    p_action: 'campanha_editada',
    p_resource_table: 'point_campaigns',
    p_resource_id: campaignId,
    p_data: validated.data,
  })

  revalidatePath('/admin/campanhas')
  redirect('/admin/campanhas')
}

export async function deleteCampaign(campaignId: string) {
  await requireRole('admin')
  const supabase = await createClient()
  const { error } = await supabase.from('point_campaigns').delete().eq('id', campaignId)
  if (error) return

  await supabase.rpc('log_audit', {
    p_action: 'campanha_excluida',
    p_resource_table: 'point_campaigns',
    p_resource_id: campaignId,
  })
  revalidatePath('/admin/campanhas')
}
