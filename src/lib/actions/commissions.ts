'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { parseCommissionRuleFormData, type CommissionRuleFormState } from '@/lib/validations/commission-rule'

export async function createCommissionRule(
  _prevState: CommissionRuleFormState,
  formData: FormData,
): Promise<CommissionRuleFormState> {
  await requireRole('admin')

  const validated = parseCommissionRuleFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('commission_rules')
    .insert(validated.data)
    .select('id')
    .single()
  if (error) return { error: 'Erro ao criar regra de comissão.' }

  await supabase.rpc('log_audit', {
    p_action: 'regra_comissao_criada',
    p_resource_table: 'commission_rules',
    p_resource_id: data.id,
    p_data: validated.data,
  })

  revalidatePath('/admin/comissoes')
  return undefined
}

export async function updateCommissionRule(
  ruleId: string,
  _prevState: CommissionRuleFormState,
  formData: FormData,
): Promise<CommissionRuleFormState> {
  await requireRole('admin')

  const validated = parseCommissionRuleFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('commission_rules').update(validated.data).eq('id', ruleId)
  if (error) return { error: 'Erro ao salvar regra de comissão.' }

  await supabase.rpc('log_audit', {
    p_action: 'regra_comissao_editada',
    p_resource_table: 'commission_rules',
    p_resource_id: ruleId,
    p_data: validated.data,
  })

  revalidatePath('/admin/comissoes')
  return undefined
}

export async function toggleCommissionRuleStatus(ruleId: string, status: 'ativa' | 'inativa') {
  await requireRole('admin')
  const supabase = await createClient()
  const { error } = await supabase.from('commission_rules').update({ status }).eq('id', ruleId)
  if (error) return

  await supabase.rpc('log_audit', {
    p_action: 'regra_comissao_status_alterado',
    p_resource_table: 'commission_rules',
    p_resource_id: ruleId,
    p_data: { status },
  })
  revalidatePath('/admin/comissoes')
}

const COMMISSION_STATUSES = ['pendente', 'aprovada', 'paga', 'cancelada'] as const

export async function updateCommissionStatus(commissionId: string, status: string) {
  await requireRole('admin')
  if (!COMMISSION_STATUSES.includes(status as (typeof COMMISSION_STATUSES)[number])) return

  const supabase = await createClient()
  const { error } = await supabase.from('commissions').update({ status }).eq('id', commissionId)
  if (error) return

  await supabase.rpc('log_audit', {
    p_action: 'comissao_status_alterado',
    p_resource_table: 'commissions',
    p_resource_id: commissionId,
    p_data: { status },
  })

  revalidatePath('/admin/comissoes')
}
