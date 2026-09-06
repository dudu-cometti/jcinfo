import Link from 'next/link'
import { getDashboardMetrics } from '@/lib/data/dashboard'
import { DATE_RANGE_OPTIONS, type DateRangeKey } from '@/lib/data/date-range'
import { StatCard, Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatBRL } from '@/lib/utils'

export const metadata = { title: 'Dashboard' }

function buildRangeHref(range: DateRangeKey) {
  return `/admin/dashboard?range=${range}`
}

export default async function AdminDashboardPage({
  searchParams,
}: PageProps<'/admin/dashboard'>) {
  const params = await searchParams
  const rangeKey = (Array.isArray(params.range) ? params.range[0] : params.range) as
    | DateRangeKey
    | undefined
  const from = Array.isArray(params.from) ? params.from[0] : params.from
  const to = Array.isArray(params.to) ? params.to[0] : params.to

  const metrics = await getDashboardMetrics(rangeKey, from, to)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-neutral-900">Dashboard</h1>
        <div className="flex flex-wrap gap-1 rounded-lg border border-neutral-200 bg-white p-1">
          {DATE_RANGE_OPTIONS.filter((o) => o.value !== 'personalizado').map((option) => (
            <Link
              key={option.value}
              href={buildRangeHref(option.value)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                metrics.range.key === option.value
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Vendas hoje" value={String(metrics.salesToday.count)} hint={formatBRL(metrics.salesToday.revenue)} />
        <StatCard
          label="Faturamento (período)"
          value={formatBRL(metrics.salesInRange.revenue)}
          hint={`${metrics.salesInRange.count} vendas`}
        />
        <StatCard label="Ticket médio" value={formatBRL(metrics.salesInRange.averageTicket)} />
        <StatCard label="Clientes cadastrados" value={String(metrics.customersTotal)} hint={`+${metrics.newCustomers} no período`} />
        <StatCard label="Pontos distribuídos" value={metrics.pointsDistributed.toLocaleString('pt-BR')} />
        <StatCard label="Pontos utilizados" value={metrics.pointsUsed.toLocaleString('pt-BR')} />
        <StatCard label="Estoque baixo" value={String(metrics.lowStockCount)} hint="produtos abaixo do mínimo" />
        <StatCard label="Produtos em destaque" value={String(metrics.featuredCount)} />
        <StatCard label="Campanhas ativas" value={String(metrics.activeCampaigns)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Produtos mais vendidos</h2>
          {metrics.topProducts.length === 0 ? (
            <p className="text-sm text-neutral-400">Nenhuma venda confirmada no período.</p>
          ) : (
            <ul className="space-y-2">
              {metrics.topProducts.map((p) => (
                <li key={p.productId} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">{p.name}</span>
                  <Badge>{p.quantity} un.</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Categorias mais vendidas</h2>
          {metrics.topCategories.length === 0 ? (
            <p className="text-sm text-neutral-400">Nenhuma venda confirmada no período.</p>
          ) : (
            <ul className="space-y-2">
              {metrics.topCategories.map((c) => (
                <li key={c.name} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">{c.name}</span>
                  <Badge>{c.quantity} un.</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Vendedores</h2>
          {metrics.topSellers.length === 0 ? (
            <p className="text-sm text-neutral-400">Nenhuma venda confirmada no período.</p>
          ) : (
            <ul className="space-y-2">
              {metrics.topSellers.map((s) => (
                <li key={s.sellerId} className="flex items-center justify-between text-sm">
                  <span className="text-neutral-700">{s.name}</span>
                  <span className="text-neutral-500">{formatBRL(s.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
