'use server'

import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import {
  parsePaymentMachineFormData,
  parsePaymentRateRuleFormData,
  type PaymentMachineFormState,
  type PaymentRateRuleFormState,
} from '@/lib/validations/payment-rate'

export async function createMachine(
  _prevState: PaymentMachineFormState,
  formData: FormData,
): Promise<PaymentMachineFormState> {
  await requireRole('admin')

  const validated = parsePaymentMachineFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('payment_machines').insert(validated.data)
  if (error) return { error: 'Erro ao cadastrar máquina.' }

  revalidatePath('/admin/taxas')
  revalidatePath('/vendedor/taxas')
  return { success: true }
}

export async function updateMachine(
  machineId: string,
  _prevState: PaymentMachineFormState,
  formData: FormData,
): Promise<PaymentMachineFormState> {
  await requireRole('admin')

  const validated = parsePaymentMachineFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('payment_machines').update(validated.data).eq('id', machineId)
  if (error) return { error: 'Erro ao salvar máquina.' }

  revalidatePath('/admin/taxas')
  revalidatePath('/vendedor/taxas')
  return { success: true }
}

export async function createRateRule(
  _prevState: PaymentRateRuleFormState,
  formData: FormData,
): Promise<PaymentRateRuleFormState> {
  await requireRole('admin')

  const validated = parsePaymentRateRuleFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('payment_rate_rules').insert(validated.data)
  if (error) return { error: 'Erro ao cadastrar taxa.' }

  await supabase.rpc('log_audit', {
    p_action: 'taxa_criada',
    p_resource_table: 'payment_rate_rules',
    p_resource_id: null,
    p_data: { machine_id: validated.data.machine_id, method: validated.data.method, installments: validated.data.installments },
  })

  revalidatePath('/admin/taxas')
  revalidatePath('/vendedor/taxas')
  return { success: true }
}

export async function updateRateRule(
  ruleId: string,
  _prevState: PaymentRateRuleFormState,
  formData: FormData,
): Promise<PaymentRateRuleFormState> {
  await requireRole('admin')

  const validated = parsePaymentRateRuleFormData(formData)
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('payment_rate_rules').update(validated.data).eq('id', ruleId)
  if (error) return { error: 'Erro ao salvar taxa.' }

  revalidatePath('/admin/taxas')
  revalidatePath('/vendedor/taxas')
  return { success: true }
}

export async function toggleRuleStatus(ruleId: string, status: 'ativa' | 'inativa'): Promise<{ error?: string }> {
  await requireRole('admin')

  const supabase = await createClient()
  const { error } = await supabase.from('payment_rate_rules').update({ status }).eq('id', ruleId)
  if (error) return { error: 'Erro ao atualizar status da taxa.' }

  revalidatePath('/admin/taxas')
  revalidatePath('/vendedor/taxas')
  return {}
}

export async function toggleMachineStatus(machineId: string, status: 'ativo' | 'inativo'): Promise<{ error?: string }> {
  await requireRole('admin')

  const supabase = await createClient()
  const { error } = await supabase.from('payment_machines').update({ status }).eq('id', machineId)
  if (error) return { error: 'Erro ao atualizar status da máquina.' }

  revalidatePath('/admin/taxas')
  revalidatePath('/vendedor/taxas')
  return {}
}

/**
 * DELETE direto em payment_machines/payment_rate_rules não existe mais via
 * RLS (migration 20260101000052) — só estas funções, que recusam apagar
 * se já existir orçamento/venda usando a máquina/taxa. Sem uso nenhum, a
 * exclusão é permitida (a confirmação fica a cargo da UI).
 */
export async function deleteMachine(machineId: string): Promise<{ error?: string }> {
  await requireRole('admin')

  const supabase = await createClient()
  const { error } = await supabase.rpc('delete_payment_machine', { p_machine_id: machineId })
  if (error) {
    return {
      error: error.message.includes('already been used')
        ? 'Esta máquina já foi usada em algum orçamento ou venda e não pode ser excluída — inative-a em vez disso.'
        : 'Erro ao excluir máquina.',
    }
  }

  revalidatePath('/admin/taxas')
  revalidatePath('/vendedor/taxas')
  return {}
}

export async function deleteRateRule(ruleId: string): Promise<{ error?: string }> {
  await requireRole('admin')

  const supabase = await createClient()
  const { error } = await supabase.rpc('delete_payment_rate_rule', { p_rule_id: ruleId })
  if (error) {
    return {
      error: error.message.includes('already been used')
        ? 'Esta taxa já foi usada em algum orçamento e não pode ser excluída — inative-a em vez disso.'
        : 'Erro ao excluir taxa.',
    }
  }

  revalidatePath('/admin/taxas')
  revalidatePath('/vendedor/taxas')
  return {}
}
