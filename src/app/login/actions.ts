'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { loginSchema, type LoginFormState } from '@/lib/validations/auth'

const ROLE_HOME: Record<string, string> = {
  admin: '/admin/dashboard',
  vendedor: '/vendedor/dashboard',
}

export async function login(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const validated = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validated.success) {
    return { error: 'Informe um e-mail e senha válidos.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(validated.data)

  if (error || !data.user) {
    return { error: 'E-mail ou senha incorretos.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', data.user.id)
    .single()

  if (!profile || !profile.active) {
    await supabase.auth.signOut()
    return { error: 'Este usuário não tem acesso ao painel.' }
  }

  redirect(ROLE_HOME[profile.role] ?? '/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
