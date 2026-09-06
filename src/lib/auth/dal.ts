import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export type AppRole = Database['public']['Enums']['user_role']

export type SessionUser = {
  id: string
  email: string | null
  role: AppRole
  fullName: string
}

/**
 * Verifies the Supabase session AND loads the caller's role from `profiles`.
 * This is the SECURE check (hits the database) and must be used by every
 * Server Action, Route Handler and Server Component that needs to know who
 * the user is or what they're allowed to do. Memoized per-request with
 * React's `cache` so multiple calls don't re-query.
 */
export const verifySession = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  return {
    id: user.id,
    email: user.email ?? null,
    role: profile.role,
    fullName: profile.full_name,
  }
})

/** Redirects to /login if there is no session. Returns the session user otherwise. */
export async function requireSession(): Promise<SessionUser> {
  const session = await verifySession()
  if (!session) redirect('/login')
  return session
}

/** Redirects if there is no session, or if the session's role isn't in `roles`. */
export async function requireRole(...roles: AppRole[]): Promise<SessionUser> {
  const session = await requireSession()
  if (!roles.includes(session.role)) {
    redirect('/')
  }
  return session
}
