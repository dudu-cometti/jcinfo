import { NextResponse, type NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  await requireRole('admin', 'vendedor')

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ customers: [] })

  const digitsOnly = q.replace(/\D/g, '')
  const supabase = await createClient()
  const query = supabase.from('customers').select('id, name, phone, points').limit(10)

  const { data } =
    digitsOnly.length >= 3
      ? await query.or(`name.ilike.%${q}%,phone.ilike.%${digitsOnly}%`)
      : await query.ilike('name', `%${q}%`)

  return NextResponse.json({ customers: data ?? [] })
}
