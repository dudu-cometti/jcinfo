import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type CustomerSession = {
  id: string
  name: string
  phone: string
  email: string | null
  points: number
  totalSpent: number
}

/**
 * Mirrors lib/auth/dal.ts but for customer accounts, which are a separate
 * concern from staff (profiles/user_role): a customer is a Supabase Auth
 * user linked via customers.auth_user_id, never a profiles row. See
 * migration 000020_customer_accounts.sql.
 */
export const verifyCustomerSession = cache(async (): Promise<CustomerSession | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, phone, email, points, total_spent')
    .eq('auth_user_id', user.id)
    .single()

  if (!customer) return null

  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    points: customer.points,
    totalSpent: customer.total_spent,
  }
})

export async function requireCustomerSession(): Promise<CustomerSession> {
  const session = await verifyCustomerSession()
  if (!session) redirect('/cliente/login')
  return session
}
