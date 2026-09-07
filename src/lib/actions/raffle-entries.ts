'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { leadSchema } from '@/lib/validations/lead'

export type RaffleSignupState = { error?: string; success?: boolean } | undefined

/**
 * Public, unauthenticated (same reasoning as lib/actions/preorder-signups.ts):
 * the service-role client bypasses raffle_entries RLS, which is staff-only.
 * Re-submitting the same phone for the same raffle is treated as success
 * (the customer is already participating), not an error.
 */
export async function createRaffleSignup(
  raffleId: string,
  _prevState: RaffleSignupState,
  formData: FormData,
): Promise<RaffleSignupState> {
  const validated = leadSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
  })
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const admin = createAdminClient()

  const { data: raffle } = await admin.from('raffles').select('status').eq('id', raffleId).maybeSingle()
  if (!raffle || raffle.status !== 'aberto') {
    return { error: 'Este sorteio não está mais aberto para inscrições.' }
  }

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

  const { error: entryError } = await admin
    .from('raffle_entries')
    .insert({ raffle_id: raffleId, customer_id: customerId })

  if (entryError && entryError.code !== '23505') {
    return { error: 'Erro ao registrar sua inscrição. Tente novamente.' }
  }

  const supabase = await createClient()
  await supabase.rpc('log_audit', {
    p_action: 'sorteio_inscricao_criada',
    p_resource_table: 'raffle_entries',
    p_resource_id: raffleId,
    p_data: { name: validated.data.name, phone: validated.data.phone, already_signed_up: Boolean(entryError) },
  })

  revalidatePath('/sorteios')
  revalidatePath(`/admin/sorteios/${raffleId}`)
  return { success: true }
}
