import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { resolveDateRange, DATE_RANGE_OPTIONS, type DateRangeKey } from '@/lib/data/date-range'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatBRL, formatDateTime } from '@/lib/utils'

export const metadata = { title: 'Relatório de vendas' }

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function RelatorioVendasPage({ searchParams }: PageProps<'/admin/relatorios/vendas'>) {
  const params = await searchParams
  const rangeKey = firstParam(params.range) as DateRangeKey | undefined
  const { start, end, key } = resolveDateRange(rangeKey)

  const supabase = await createClient()
  const { data } = await supabase
    .from('sales')
    .select('id, status, total, confirmed_at, customer:customers(name), seller:profiles(full_name)')
    .in('status', ['confirmada', 'concluida'])
    .gte('confirmed_at', start.toISOString())
    .lte('confirmed_at', end.toISOString())
    .order('confirmed_at', { ascending: false })

  type Row = { id: string; status: string; total: number; confirmed_at: string | null; customer: { name: string } | null; seller: { full_name: string } | null }
  const rows = (data ?? []) as unknown as Row[]
  const total = rows.reduce((sum, r) => sum + Number(r.total), 0)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-neutral-900">Relatório de vendas</h1>
        <a href={`/api/reports/vendas/export?range=${key}`}>
          <Button variant="secondary">Exportar CSV</Button>
        </a>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-neutral-200 bg-white p-1">
        {DATE_RANGE_OPTIONS.filter((o) => o.value !== 'personalizado').map((option) => (
          <Link
            key={option.value}
            href={`/admin/relatorios/vendas?range=${option.value}`}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              key === option.value ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {option.label}
          </Link>
        ))}
      </div>

      <p className="text-sm text-neutral-500">
        {rows.length} venda(s) · Total: <strong>{formatBRL(total)}</strong>
      </p>

      <Table>
        <Thead>
          <Th>Data</Th>
          <Th>Cliente</Th>
          <Th>Vendedor</Th>
          <Th>Status</Th>
          <Th>Total</Th>
        </Thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyState message="Nenhuma venda no período selecionado." />
          ) : (
            rows.map((sale) => (
              <Tr key={sale.id}>
                <Td className="text-xs text-neutral-500">{sale.confirmed_at ? formatDateTime(sale.confirmed_at) : '—'}</Td>
                <Td>{sale.customer?.name ?? '—'}</Td>
                <Td>{sale.seller?.full_name ?? '—'}</Td>
                <Td>
                  <Badge tone="green">{sale.status}</Badge>
                </Td>
                <Td>{formatBRL(sale.total)}</Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  )
}
