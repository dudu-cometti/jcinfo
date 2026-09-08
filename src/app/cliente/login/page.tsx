import { redirect } from 'next/navigation'
import { verifyCustomerSession } from '@/lib/auth/customer-dal'
import { LoginForm } from './LoginForm'

export default async function CustomerLoginPage() {
  const session = await verifyCustomerSession()
  if (session) redirect('/cliente/dashboard')

  return <LoginForm />
}
