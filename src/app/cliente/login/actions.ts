'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { customerLoginSchema, type CustomerLoginState } from '@/lib/validations/customer-account'

export async function loginCustomer(
  _prevState: CustomerLoginState,
  formData: FormData,
): Promise<CustomerLoginState> {
  const validated = customerLoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!validated.success) {
    return { error: validated.error.issues[0]?.message ?? 'Dados inválidos.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(validated.data)

  if (error || !data.user) {
    return { error: 'E-mail ou senha incorretos.' }
  }

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('auth_user_id', data.user.id)
    .maybeSingle()

  if (!customer) {
    await supabase.auth.signOut()
    return { error: 'Esta conta não é uma conta de cliente.' }
  }

  redirect('/cliente/dashboard')
}

export async function logoutCustomer() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/cliente/login')
}
