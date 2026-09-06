'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { parseRewardFormData, type RewardFormState } from '@/lib/validations/reward'

export async function createReward(
  _prevState: RewardFormState,
  formData: FormData,
): Promise<RewardFormState> {
  await requireRole('admin')

  const validated = parseRewardFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from('rewards').insert(validated.data).select('id').single()
  if (error) return { error: 'Erro ao criar prêmio.' }

  await supabase.rpc('log_audit', {
    p_action: 'premio_criado',
    p_resource_table: 'rewards',
    p_resource_id: data.id,
    p_data: validated.data,
  })

  revalidatePath('/admin/premios')
  redirect('/admin/premios')
}

export async function updateReward(
  rewardId: string,
  _prevState: RewardFormState,
  formData: FormData,
): Promise<RewardFormState> {
  await requireRole('admin')

  const validated = parseRewardFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('rewards').update(validated.data).eq('id', rewardId)
  if (error) return { error: 'Erro ao salvar prêmio.' }

  await supabase.rpc('log_audit', {
    p_action: 'premio_editado',
    p_resource_table: 'rewards',
    p_resource_id: rewardId,
    p_data: validated.data,
  })

  revalidatePath('/admin/premios')
  redirect('/admin/premios')
}

export async function deleteReward(rewardId: string) {
  await requireRole('admin')
  const supabase = await createClient()
  const { error } = await supabase.from('rewards').delete().eq('id', rewardId)
  if (error) return

  await supabase.rpc('log_audit', {
    p_action: 'premio_excluido',
    p_resource_table: 'rewards',
    p_resource_id: rewardId,
  })
  revalidatePath('/admin/premios')
}
