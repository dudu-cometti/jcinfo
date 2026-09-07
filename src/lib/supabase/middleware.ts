import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_PREFIX = '/admin'
const VENDEDOR_PREFIX = '/vendedor'
const LOGIN_PATH = '/login'
const CUSTOMER_DASHBOARD_PREFIX = '/cliente/dashboard'
const CUSTOMER_LOGIN_PATH = '/cliente/login'

/**
 * Refreshes the Supabase auth session on every request and performs an
 * OPTIMISTIC authentication check (session exists or not) for /admin and
 * /vendedor routes.
 *
 * Role-based authorization (admin vs vendedor) is intentionally NOT done
 * here: that requires a `profiles` table lookup, and per Next.js/Supabase
 * guidance, Proxy runs on every request (including prefetches) so it should
 * stay cookie-only. The real, secure role check happens close to the data —
 * see src/lib/auth/dal.ts, used in layouts, Server Actions and queries.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data } = await supabase.auth.getClaims()

  const { pathname } = request.nextUrl
  const isAdminRoute = pathname.startsWith(ADMIN_PREFIX)
  const isVendedorRoute = pathname.startsWith(VENDEDOR_PREFIX)
  const isCustomerDashboardRoute = pathname.startsWith(CUSTOMER_DASHBOARD_PREFIX)

  if ((isAdminRoute || isVendedorRoute) && !data?.claims) {
    const url = request.nextUrl.clone()
    url.pathname = LOGIN_PATH
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  if (isCustomerDashboardRoute && !data?.claims) {
    const url = request.nextUrl.clone()
    url.pathname = CUSTOMER_LOGIN_PATH
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
