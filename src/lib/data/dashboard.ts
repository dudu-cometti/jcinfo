import { createClient } from '@/lib/supabase/server'
import { resolveDateRange, type DateRangeKey } from '@/lib/data/date-range'

const CONFIRMED_STATUSES = ['confirmada', 'concluida']

export type DashboardMetrics = {
  range: { start: string; end: string; key: DateRangeKey }
  salesToday: { count: number; revenue: number }
  salesInRange: { count: number; revenue: number; averageTicket: number }
  topProducts: { productId: string; name: string; quantity: number; revenue: number }[]
  topCategories: { name: string; quantity: number; revenue: number }[]
  topSellers: { sellerId: string; name: string; count: number; revenue: number }[]
  customersTotal: number
  newCustomers: number
  pointsDistributed: number
  pointsUsed: number
  lowStockCount: number
  featuredCount: number
  activeCampaigns: number
}

export async function getDashboardMetrics(
  rangeKey?: DateRangeKey,
  from?: string,
  to?: string,
): Promise<DashboardMetrics> {
  const supabase = await createClient()
  const { start, end, key } = resolveDateRange(rangeKey, from, to)
  const startIso = start.toISOString()
  const endIso = end.toISOString()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    salesTodayRes,
    salesInRangeRes,
    saleItemsRes,
    sellersRes,
    customersTotalRes,
    newCustomersRes,
    pointsInRes,
    pointsOutRes,
    lowStockRes,
    featuredRes,
    campaignsRes,
  ] = await Promise.all([
    supabase
      .from('sales')
      .select('total')
      .in('status', CONFIRMED_STATUSES)
      .gte('confirmed_at', todayStart.toISOString()),
    supabase
      .from('sales')
      .select('total')
      .in('status', CONFIRMED_STATUSES)
      .gte('confirmed_at', startIso)
      .lte('confirmed_at', endIso),
    supabase
      .from('sale_items')
      .select(
        'quantity, subtotal, product:products(id, name, category:categories(name)), sale:sales!inner(status, confirmed_at)',
      )
      .in('sale.status', CONFIRMED_STATUSES)
      .gte('sale.confirmed_at', startIso)
      .lte('sale.confirmed_at', endIso),
    supabase
      .from('sales')
      .select('seller_id, total, seller:profiles(full_name)')
      .in('status', CONFIRMED_STATUSES)
      .gte('confirmed_at', startIso)
      .lte('confirmed_at', endIso),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startIso)
      .lte('created_at', endIso),
    supabase
      .from('points_transactions')
      .select('points')
      .eq('type', 'entrada')
      .gte('created_at', startIso)
      .lte('created_at', endIso),
    supabase
      .from('points_transactions')
      .select('points')
      .in('type', ['saida', 'estorno'])
      .gte('created_at', startIso)
      .lte('created_at', endIso),
    supabase.from('products').select('stock, min_stock').eq('status', 'ativo'),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ativo')
      .eq('featured', true),
    supabase.from('point_campaigns').select('*', { count: 'exact', head: true }).eq('status', 'ativa'),
  ])

  const salesToday = {
    count: salesTodayRes.data?.length ?? 0,
    revenue: (salesTodayRes.data ?? []).reduce((sum, s) => sum + Number(s.total), 0),
  }

  const salesInRangeRows = salesInRangeRes.data ?? []
  const salesInRangeRevenue = salesInRangeRows.reduce((sum, s) => sum + Number(s.total), 0)
  const salesInRange = {
    count: salesInRangeRows.length,
    revenue: salesInRangeRevenue,
    averageTicket: salesInRangeRows.length > 0 ? salesInRangeRevenue / salesInRangeRows.length : 0,
  }

  type SaleItemRow = {
    quantity: number
    subtotal: number
    product: { id: string; name: string; category: { name: string } | null } | null
  }
  const saleItems = (saleItemsRes.data ?? []) as unknown as SaleItemRow[]

  const productTotals = new Map<string, { name: string; quantity: number; revenue: number }>()
  const categoryTotals = new Map<string, { quantity: number; revenue: number }>()

  for (const item of saleItems) {
    if (!item.product) continue
    const productEntry = productTotals.get(item.product.id) ?? {
      name: item.product.name,
      quantity: 0,
      revenue: 0,
    }
    productEntry.quantity += item.quantity
    productEntry.revenue += Number(item.subtotal)
    productTotals.set(item.product.id, productEntry)

    const categoryName = item.product.category?.name ?? 'Sem categoria'
    const categoryEntry = categoryTotals.get(categoryName) ?? { quantity: 0, revenue: 0 }
    categoryEntry.quantity += item.quantity
    categoryEntry.revenue += Number(item.subtotal)
    categoryTotals.set(categoryName, categoryEntry)
  }

  const topProducts = [...productTotals.entries()]
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  const topCategories = [...categoryTotals.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  type SellerRow = { seller_id: string; total: number; seller: { full_name: string } | null }
  const sellerRows = (sellersRes.data ?? []) as unknown as SellerRow[]
  const sellerTotals = new Map<string, { name: string; count: number; revenue: number }>()
  for (const row of sellerRows) {
    const entry = sellerTotals.get(row.seller_id) ?? {
      name: row.seller?.full_name ?? 'Vendedor',
      count: 0,
      revenue: 0,
    }
    entry.count += 1
    entry.revenue += Number(row.total)
    sellerTotals.set(row.seller_id, entry)
  }
  const topSellers = [...sellerTotals.entries()]
    .map(([sellerId, v]) => ({ sellerId, ...v }))
    .sort((a, b) => b.revenue - a.revenue)

  return {
    range: { start: startIso, end: endIso, key },
    salesToday,
    salesInRange,
    topProducts,
    topCategories,
    topSellers,
    customersTotal: customersTotalRes.count ?? 0,
    newCustomers: newCustomersRes.count ?? 0,
    pointsDistributed: (pointsInRes.data ?? []).reduce((sum, p) => sum + p.points, 0),
    pointsUsed: (pointsOutRes.data ?? []).reduce((sum, p) => sum + Math.abs(p.points), 0),
    lowStockCount: (lowStockRes.data ?? []).filter((p) => p.stock <= p.min_stock).length,
    featuredCount: featuredRes.count ?? 0,
    activeCampaigns: campaignsRes.count ?? 0,
  }
}
