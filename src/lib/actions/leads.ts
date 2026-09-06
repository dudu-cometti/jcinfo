'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { leadSchema, type LeadFormState } from '@/lib/validations/lead'

/**
 * Public, unauthenticated entry point (clicking "Falar no WhatsApp" on the
 * storefront) — so it can't go through the normal customer Server Actions,
 * which require requireRole('admin', 'vendedor') per the customers RLS
 * policies. Uses the service-role client instead, gated by the same Zod
 * validation as the staff-facing form. Find-or-create by phone so a visitor
 * who reaches out more than once doesn't create duplicate customer rows.
 */
export async function createLead(
  _prevState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const validated = leadSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
  })
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('customers')
    .select('id')
    .eq('phone', validated.data.phone)
    .maybeSingle()

  const customerId = existing?.id ?? (await insertLead(admin, validated.data))
  if (!customerId) {
    return { error: 'Erro ao registrar seus dados. Tente novamente.' }
  }

  const supabase = await createClient()
  await supabase.rpc('log_audit', {
    p_action: 'lead_capturado',
    p_resource_table: 'customers',
    p_resource_id: customerId,
    p_data: { name: validated.data.name, phone: validated.data.phone, existing: Boolean(existing) },
  })

  return { customerId }
}

async function insertLead(
  admin: ReturnType<typeof createAdminClient>,
  data: { name: string; phone: string },
): Promise<string | null> {
  const { data: created, error } = await admin
    .from('customers')
    .insert({ name: data.name, phone: data.phone })
    .select('id')
    .single()

  if (error) return null
  return created.id
}
