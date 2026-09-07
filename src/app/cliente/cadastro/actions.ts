'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { customerRegisterSchema, type CustomerRegisterState } from '@/lib/validations/customer-account'

export async function registerCustomer(
  _prevState: CustomerRegisterState,
  formData: FormData,
): Promise<CustomerRegisterState> {
  const validated = customerRegisterSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    cpf: formData.get('cpf'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  })
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const admin = createAdminClient()

  // Someone may already exist as a lead (WhatsApp click, pre-order signup)
  // without an account yet — link to that row instead of creating a
  // duplicate customer, so their points/history aren't lost.
  const { data: matches } = await admin
    .from('customers')
    .select('id, auth_user_id')
    .or(`phone.eq.${validated.data.phone},cpf.eq.${validated.data.cpf},email.eq.${validated.data.email}`)
    .limit(1)

  const existing = matches?.[0]
  if (existing?.auth_user_id) {
    return { error: 'Já existe uma conta com esses dados. Faça login.' }
  }

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: validated.data.email,
    password: validated.data.password,
    email_confirm: true,
    user_metadata: { full_name: validated.data.name, account_type: 'customer' },
  })

  if (authError || !authData.user) {
    return {
      error: authError?.message.includes('already been registered')
        ? 'Este e-mail já está cadastrado.'
        : 'Erro ao criar sua conta. Tente novamente.',
    }
  }

  const customerData = {
    name: validated.data.name,
    email: validated.data.email,
    cpf: validated.data.cpf,
    auth_user_id: authData.user.id,
  }

  const { error: linkError } = existing
    ? await admin.from('customers').update(customerData).eq('id', existing.id)
    : await admin.from('customers').insert({ ...customerData, phone: validated.data.phone })

  if (linkError) {
    await admin.auth.admin.deleteUser(authData.user.id)
    return {
      error: linkError.code === '23505' ? 'CPF ou telefone já cadastrado em outra conta.' : 'Erro ao criar seu cadastro.',
    }
  }

  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  })
  if (signInError) {
    return { error: 'Conta criada. Faça login para continuar.' }
  }

  redirect('/cliente/dashboard')
}
