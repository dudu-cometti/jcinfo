import { createClient } from '@/lib/supabase/server'
import { resolveDateRange, DATE_RANGE_OPTIONS, type DateRangeKey } from '@/lib/data/date-range'
import Link from 'next/link'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatBRL } from '@/lib/utils'

export const metadata = { title: 'Relatório de vendedores' }

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function RelatorioVendedoresPage({
  searchParams,
}: PageProps<'/admin/relatorios/vendedores'>) {
  const params = await searchParams
  const rangeKey = firstParam(params.range) as DateRangeKey | undefined
  const { start, end, key } = resolveDateRange(rangeKey)

  const supabase = await createClient()
  const [{ data: sales }, { data: commissions }] = await Promise.all([
    supabase
      .from('sales')
      .select('seller_id, total, seller:profiles(full_name)')
      .in('status', ['confirmada', 'concluida'])
      .gte('confirmed_at', start.toISOString())
      .lte('confirmed_at', end.toISOString()),
    supabase
      .from('commissions')
      .select('seller_id, commission_amount')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString()),
  ])

  type SaleRow = { seller_id: string; total: number; seller: { full_name: string } | null }
  const saleRows = (sales ?? []) as unknown as SaleRow[]

  const bySeller = new Map<string, { name: string; salesCount: number; revenue: number; commission: number }>()
  for (const row of saleRows) {
    const entry = bySeller.get(row.seller_id) ?? {
      name: row.seller?.full_name ?? 'Vendedor',
      salesCount: 0,
      revenue: 0,
      commission: 0,
    }
    entry.salesCount += 1
    entry.revenue += Number(row.total)
    bySeller.set(row.seller_id, entry)
  }
  for (const commission of commissions ?? []) {
    const entry = bySeller.get(commission.seller_id)
    if (entry) entry.commission += Number(commission.commission_amount)
  }

  const rows = [...bySeller.values()].sort((a, b) => b.revenue - a.revenue)

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-neutral-900">Relatório de vendedores</h1>

      <div className="flex flex-wrap gap-1 rounded-lg border border-neutral-200 bg-white p-1">
        {DATE_RANGE_OPTIONS.filter((o) => o.value !== 'personalizado').map((option) => (
          <Link
            key={option.value}
            href={`/admin/relatorios/vendedores?range=${option.value}`}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              key === option.value ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {option.label}
          </Link>
        ))}
      </div>

      <Table>
        <Thead>
          <Th>Vendedor</Th>
          <Th>Vendas</Th>
          <Th>Faturamento</Th>
          <Th>Comissão</Th>
        </Thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyState message="Nenhuma venda no período selecionado." />
          ) : (
            rows.map((row) => (
              <Tr key={row.name}>
                <Td className="font-medium text-neutral-900">{row.name}</Td>
                <Td>{row.salesCount}</Td>
                <Td>{formatBRL(row.revenue)}</Td>
                <Td>{formatBRL(row.commission)}</Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  )
}
