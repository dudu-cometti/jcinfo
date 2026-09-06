import { createClient } from '@/lib/supabase/server'

export type ProductVelocity = {
  productId: string
  name: string
  sku: string | null
  stock: number
  totalSold: number
  unitsPerDay: number
  daysOfStockLeft: number | null
  lastSaleAt: string | null
  daysSinceLastSale: number | null
}

const LOOKBACK_DAYS = 180

/**
 * "Giro de estoque": how fast each active product sells, based on
 * inventory_movements of type 'venda' (written only by confirm_sale(), so
 * this reflects real confirmed sales, never pending/cancelled ones) over a
 * rolling window — not all-time, so a product that sold well two years ago
 * but nothing since doesn't get flagged as a fast mover today.
 */
export async function getStockVelocity(): Promise<{ fastest: ProductVelocity[]; slowest: ProductVelocity[] }> {
  const supabase = await createClient()
  const since = new Date()
  since.setDate(since.getDate() - LOOKBACK_DAYS)

  const [{ data: products }, { data: movements }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, sku, stock, created_at')
      .eq('status', 'ativo'),
    supabase
      .from('inventory_movements')
      .select('product_id, quantity, created_at')
      .eq('type', 'venda')
      .gte('created_at', since.toISOString()),
  ])

  const soldByProduct = new Map<string, { total: number; lastSaleAt: string }>()
  for (const m of movements ?? []) {
    const entry = soldByProduct.get(m.product_id) ?? { total: 0, lastSaleAt: m.created_at }
    entry.total += Math.abs(m.quantity)
    if (m.created_at > entry.lastSaleAt) entry.lastSaleAt = m.created_at
    soldByProduct.set(m.product_id, entry)
  }

  const now = Date.now()
  const windowDays = Math.min(
    LOOKBACK_DAYS,
    Math.max(1, Math.round((now - since.getTime()) / (1000 * 60 * 60 * 24))),
  )

  const velocities: ProductVelocity[] = (products ?? []).map((p) => {
    const sold = soldByProduct.get(p.id)
    const totalSold = sold?.total ?? 0
    const productAgeDays = Math.max(
      1,
      Math.round((now - new Date(p.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    )
    const effectiveDays = Math.min(windowDays, productAgeDays)
    const unitsPerDay = totalSold / effectiveDays
    const daysSinceLastSale = sold
      ? Math.round((now - new Date(sold.lastSaleAt).getTime()) / (1000 * 60 * 60 * 24))
      : null

    return {
      productId: p.id,
      name: p.name,
      sku: p.sku,
      stock: p.stock,
      totalSold,
      unitsPerDay,
      daysOfStockLeft: unitsPerDay > 0 ? Math.round(p.stock / unitsPerDay) : null,
      lastSaleAt: sold?.lastSaleAt ?? null,
      daysSinceLastSale,
    }
  })

  const fastest = [...velocities]
    .filter((v) => v.totalSold > 0)
    .sort((a, b) => b.unitsPerDay - a.unitsPerDay)
    .slice(0, 10)

  const slowest = [...velocities]
    .filter((v) => v.stock > 0)
    .sort((a, b) => {
      // Never-sold products first (worst case — stagnant since day one),
      // then by longest time since the last sale.
      if (a.lastSaleAt === null && b.lastSaleAt === null) return 0
      if (a.lastSaleAt === null) return -1
      if (b.lastSaleAt === null) return 1
      return (b.daysSinceLastSale ?? 0) - (a.daysSinceLastSale ?? 0)
    })
    .slice(0, 10)

  return { fastest, slowest }
}
