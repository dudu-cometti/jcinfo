import { NextResponse, type NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  await requireRole('admin', 'vendedor')

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ products: [] })

  const supabase = await createClient()
  const { data } = await supabase
    .from('products_public_v')
    .select(
      'id, name, sku, model, price, promo_price, stock, condition, variants:product_variants(id, color_name, price, promo_price, stock, status)',
    )
    .eq('status', 'ativo')
    .or(`name.ilike.%${q}%,sku.ilike.%${q}%,model.ilike.%${q}%`)
    .limit(10)

  const products = (data ?? []).map((p) => ({
    ...p,
    variants: (p.variants ?? []).filter((v: { status: string }) => v.status === 'ativo'),
  }))

  return NextResponse.json({ products })
}
