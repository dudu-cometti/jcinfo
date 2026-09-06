import { createAdminClient } from '@/lib/supabase/admin'
import { resolveDateRange, type DateRangeKey } from '@/lib/data/date-range'

export type ProductProfit = {
  productId: string
  name: string
  quantitySold: number
  revenue: number
  cost: number
  profit: number
  marginPct: number | null
}

export type ProfitReport = {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  marginPct: number | null
  products: ProductProfit[]
}

/**
 * Admin-only by construction: goes through the service-role client because
 * products.cost is no longer readable via the regular (anon-key) client at
 * all (see migration 000016_products_cost_column_security.sql) — there is
 * no role check to bypass here, the column itself is inaccessible any other
 * way. Callers must still gate the page with requireRole('admin').
 */
export async function getProfitReport(rangeKey?: DateRangeKey, from?: string, to?: string): Promise<ProfitReport> {
  const { start, end } = resolveDateRange(rangeKey, from, to)
  const admin = createAdminClient()

  const { data } = await admin
    .from('sale_items')
    .select(
      'quantity, subtotal, product:products(id, name, cost), sale:sales!inner(status, confirmed_at)',
    )
    .in('sale.status', ['confirmada', 'concluida'])
    .gte('sale.confirmed_at', start.toISOString())
    .lte('sale.confirmed_at', end.toISOString())

  type Row = {
    quantity: number
    subtotal: number
    product: { id: string; name: string; cost: number | null } | null
  }
  const rows = (data ?? []) as unknown as Row[]

  const byProduct = new Map<string, ProductProfit>()
  for (const row of rows) {
    if (!row.product) continue
    const entry = byProduct.get(row.product.id) ?? {
      productId: row.product.id,
      name: row.product.name,
      quantitySold: 0,
      revenue: 0,
      cost: 0,
      profit: 0,
      marginPct: null,
    }
    const cost = (row.product.cost ?? 0) * row.quantity
    entry.quantitySold += row.quantity
    entry.revenue += Number(row.subtotal)
    entry.cost += cost
    byProduct.set(row.product.id, entry)
  }

  const products = [...byProduct.values()]
    .map((p) => ({ ...p, profit: p.revenue - p.cost, marginPct: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : null }))
    .sort((a, b) => b.profit - a.profit)

  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0)
  const totalCost = products.reduce((sum, p) => sum + p.cost, 0)
  const totalProfit = totalRevenue - totalCost

  return {
    totalRevenue,
    totalCost,
    totalProfit,
    marginPct: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : null,
    products,
  }
}
