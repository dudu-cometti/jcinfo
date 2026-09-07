'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { leadSchema } from '@/lib/validations/lead'

export type PreorderSignupState = { error?: string; success?: boolean } | undefined

/**
 * Public, unauthenticated (same reasoning as lib/actions/leads.ts): the
 * service-role client bypasses preorder_signups RLS, which is staff-only.
 * Re-submitting the same phone for the same campaign is treated as success
 * (the customer is already on the list), not an error.
 */
export async function createPreorderSignup(
  campaignId: string,
  _prevState: PreorderSignupState,
  formData: FormData,
): Promise<PreorderSignupState> {
  const validated = leadSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
  })
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const admin = createAdminClient()

  const { data: existingCustomer } = await admin
    .from('customers')
    .select('id')
    .eq('phone', validated.data.phone)
    .maybeSingle()

  let customerId = existingCustomer?.id
  if (!customerId) {
    const { data: created, error } = await admin
      .from('customers')
      .insert({ name: validated.data.name, phone: validated.data.phone })
      .select('id')
      .single()
    if (error) return { error: 'Erro ao registrar seus dados. Tente novamente.' }
    customerId = created.id
  }

  const { error: signupError } = await admin
    .from('preorder_signups')
    .insert({ campaign_id: campaignId, customer_id: customerId })

  if (signupError && signupError.code !== '23505') {
    return { error: 'Erro ao registrar sua inscrição. Tente novamente.' }
  }

  const supabase = await createClient()
  await supabase.rpc('log_audit', {
    p_action: 'pre_venda_inscricao_criada',
    p_resource_table: 'preorder_signups',
    p_resource_id: campaignId,
    p_data: { name: validated.data.name, phone: validated.data.phone, already_signed_up: Boolean(signupError) },
  })

  revalidatePath(`/admin/pre-vendas`)
  return { success: true }
}
