import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { getProfitReport } from '@/lib/data/profit'
import { DATE_RANGE_OPTIONS, resolveDateRange, type DateRangeKey } from '@/lib/data/date-range'
import { StatCard } from '@/components/ui/card'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatBRL } from '@/lib/utils'

export const metadata = { title: 'Lucro' }

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function RelatorioLucroPage({ searchParams }: PageProps<'/admin/relatorios/lucro'>) {
  // Belt-and-suspenders: the admin layout already gates every /admin/* route,
  // but this page's data (unlike every other report) reads products.cost via
  // the service-role client, bypassing the DB-level restriction entirely —
  // so it re-checks the role itself instead of relying only on the layout.
  await requireRole('admin')

  const params = await searchParams
  const rangeKey = firstParam(params.range) as DateRangeKey | undefined
  const { key } = resolveDateRange(rangeKey)
  const report = await getProfitReport(rangeKey)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Lucro</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Baseado no custo cadastrado em cada produto — visível apenas para administradores.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-neutral-200 bg-white p-1">
          {DATE_RANGE_OPTIONS.filter((o) => o.value !== 'personalizado').map((option) => (
            <Link
              key={option.value}
              href={`/admin/relatorios/lucro?range=${option.value}`}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                key === option.value ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Faturamento" value={formatBRL(report.totalRevenue)} />
        <StatCard label="Custo" value={formatBRL(report.totalCost)} />
        <StatCard label="Lucro" value={formatBRL(report.totalProfit)} />
        <StatCard label="Margem" value={report.marginPct !== null ? `${report.marginPct.toFixed(1)}%` : '—'} />
      </div>

      <Table>
        <Thead>
          <Th>Produto</Th>
          <Th>Qtd. vendida</Th>
          <Th>Faturamento</Th>
          <Th>Custo</Th>
          <Th>Lucro</Th>
          <Th>Margem</Th>
        </Thead>
        <tbody>
          {report.products.length === 0 ? (
            <EmptyState message="Nenhuma venda confirmada no período." />
          ) : (
            report.products.map((p) => (
              <Tr key={p.productId}>
                <Td className="font-medium text-neutral-900">{p.name}</Td>
                <Td>{p.quantitySold}</Td>
                <Td>{formatBRL(p.revenue)}</Td>
                <Td>{formatBRL(p.cost)}</Td>
                <Td className={p.profit >= 0 ? 'text-green-700' : 'text-red-600'}>{formatBRL(p.profit)}</Td>
                <Td>{p.marginPct !== null ? `${p.marginPct.toFixed(1)}%` : '—'}</Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  )
}
