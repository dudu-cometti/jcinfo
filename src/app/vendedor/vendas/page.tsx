import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireSession } from '@/lib/auth/dal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatBRL, formatDateTime } from '@/lib/utils'

export const metadata = { title: 'Minhas vendas' }

const STATUS_TONE: Record<string, 'neutral' | 'green' | 'red' | 'yellow' | 'blue'> = {
  pendente: 'yellow',
  confirmada: 'blue',
  concluida: 'green',
  cancelada: 'neutral',
  estornada: 'red',
}

export default async function VendedorVendasPage() {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: sales } = await supabase
    .from('sales')
    .select('id, status, total, created_at, customer:customers(name)')
    .eq('seller_id', session.id)
    .order('created_at', { ascending: false })
    .limit(50)

  type SaleRow = { id: string; status: string; total: number; created_at: string; customer: { name: string } | null }
  const rows = (sales ?? []) as unknown as SaleRow[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">Minhas vendas</h1>
        <Link href="/vendedor/vendas/nova">
          <Button>+ Nova venda</Button>
        </Link>
      </div>

      <Table>
        <Thead>
          <Th>Data</Th>
          <Th>Cliente</Th>
          <Th>Status</Th>
          <Th>Total</Th>
          <Th />
        </Thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyState message="Nenhuma venda registrada ainda." />
          ) : (
            rows.map((sale) => (
              <Tr key={sale.id}>
                <Td className="text-xs text-neutral-500">{formatDateTime(sale.created_at)}</Td>
                <Td>{sale.customer?.name ?? '-'}</Td>
                <Td>
                  <Badge tone={STATUS_TONE[sale.status]}>{sale.status}</Badge>
                </Td>
                <Td>{formatBRL(sale.total)}</Td>
                <Td>
                  <Link href={`/vendedor/vendas/${sale.id}`} className="text-sm text-neutral-600 hover:underline">
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
