import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatBRL, formatDateTime } from '@/lib/utils'

export const metadata = { title: 'Vendas' }

const STATUS_TONE: Record<string, 'neutral' | 'green' | 'red' | 'yellow' | 'blue'> = {
  pendente: 'yellow',
  confirmada: 'blue',
  concluida: 'green',
  cancelada: 'neutral',
  estornada: 'red',
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminVendasPage({ searchParams }: PageProps<'/admin/vendas'>) {
  const params = await searchParams
  const status = firstParam(params.status) ?? ''

  const supabase = await createClient()
  let query = supabase
    .from('sales')
    .select('id, status, total, created_at, customer:customers(name), seller:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('status', status)

  const { data: sales } = await query

  type SaleRow = {
    id: string
    status: string
    total: number
    created_at: string
    customer: { name: string } | null
    seller: { full_name: string } | null
  }
  const rows = (sales ?? []) as unknown as SaleRow[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">Vendas</h1>
        <Link href="/vendedor/vendas/nova">
          <Button>+ Nova venda</Button>
        </Link>
      </div>

      <form className="flex gap-3">
        <Select name="status" defaultValue={status} className="max-w-[220px]">
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="confirmada">Confirmada</option>
          <option value="concluida">Concluída</option>
          <option value="cancelada">Cancelada</option>
          <option value="estornada">Estornada</option>
        </Select>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      <Table>
        <Thead>
          <Th>Data</Th>
          <Th>Cliente</Th>
          <Th>Vendedor</Th>
          <Th>Status</Th>
          <Th>Total</Th>
          <Th />
        </Thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyState message="Nenhuma venda encontrada." />
          ) : (
            rows.map((sale) => (
              <Tr key={sale.id}>
                <Td className="text-xs text-neutral-500">{formatDateTime(sale.created_at)}</Td>
                <Td>{sale.customer?.name ?? '—'}</Td>
                <Td>{sale.seller?.full_name ?? '—'}</Td>
                <Td>
                  <Badge tone={STATUS_TONE[sale.status]}>{sale.status}</Badge>
                </Td>
                <Td>{formatBRL(sale.total)}</Td>
                <Td>
                  <Link href={`/admin/vendas/${sale.id}`} className="text-sm text-neutral-600 hover:underline">
                    Ver
                  </Link>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  )
}
