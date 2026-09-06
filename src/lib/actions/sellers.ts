'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createSellerSchema, type CreateSellerFormState } from '@/lib/validations/seller'

/**
 * Creating a Supabase Auth user requires the service role key, which never
 * reaches the browser (server-only import in lib/supabase/admin.ts). The
 * `on_auth_user_created` trigger (migration 000002) creates the matching
 * `profiles` row automatically with role='vendedor'; we only need to
 * promote it to 'admin' here when requested.
 */
export async function createSeller(
  _prevState: CreateSellerFormState,
  formData: FormData,
): Promise<CreateSellerFormState> {
  await requireRole('admin')

  const validated = createSellerSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    role: formData.get('role'),
  })
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient.auth.admin.createUser({
    email: validated.data.email,
    password: validated.data.password,
    email_confirm: true,
    user_metadata: { full_name: validated.data.full_name },
  })

  if (error || !data.user) {
    return {
      error: error?.message.includes('already been registered')
        ? 'Já existe um usuário com esse e-mail.'
        : 'Erro ao criar usuário.',
    }
  }

  const supabase = await createClient()

  if (validated.data.role === 'admin') {
    await supabase.from('profiles').update({ role: 'admin' }).eq('id', data.user.id)
  }

  await supabase.rpc('log_audit', {
    p_action: 'vendedor_criado',
    p_resource_table: 'profiles',
    p_resource_id: data.user.id,
    p_data: { full_name: validated.data.full_name, role: validated.data.role },
  })

  revalidatePath('/admin/vendedores')
  redirect('/admin/vendedores')
}

export async function setSellerActive(profileId: string, active: boolean) {
  await requireRole('admin')
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ active }).eq('id', profileId)
  if (error) return

  await supabase.rpc('log_audit', {
    p_action: active ? 'vendedor_reativado' : 'vendedor_desativado',
    p_resource_table: 'profiles',
    p_resource_id: profileId,
  })
  revalidatePath('/admin/vendedores')
}

export async function setSellerRole(profileId: string, role: 'admin' | 'vendedor') {
  await requireRole('admin')
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ role }).eq('id', profileId)
  if (error) return

  await supabase.rpc('log_audit', {
    p_action: 'vendedor_role_alterado',
    p_resource_table: 'profiles',
    p_resource_id: profileId,
    p_data: { role },
  })
  revalidatePath('/admin/vendedores')
}
