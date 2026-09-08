import { redirect } from 'next/navigation'
import { verifySession } from '@/lib/auth/dal'
import { LoginForm } from './LoginForm'

const ROLE_HOME: Record<string, string> = {
  admin: '/admin/dashboard',
  vendedor: '/vendedor/dashboard',
}

export default async function LoginPage() {
  const session = await verifySession()
  if (session) redirect(ROLE_HOME[session.role] ?? '/')

  return <LoginForm />
}
