import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { OrcamentoStatusBadge } from '@/components/orcamentos/OrcamentoStatusBadge'
import { formatBRL, formatDateTime } from '@/lib/utils'

export const metadata = { title: 'Orçamentos' }

export default async function AdminOrcamentosPage() {
  await requireRole('admin')
  const supabase = await createClient()

  const { data: orcamentos } = await supabase
    .from('orcamentos')
    .select('id, customer_name_snapshot, status, final_value, installments, created_at, expires_at, seller:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(200)

  type Row = {
    id: string
    customer_name_snapshot: string
    status: string
    final_value: number
    installments: number
    created_at: string
    expires_at: string | null
    seller: { full_name: string } | null
  }
  const rows = (orcamentos ?? []) as unknown as Row[]

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-neutral-900">Orçamentos</h1>

      <Table>
        <Thead>
          <Th>Data</Th>
          <Th>Cliente</Th>
          <Th>Vendedor</Th>
          <Th>Total</Th>
          <Th>Parcelas</Th>
          <Th>Status</Th>
          <Th></Th>
        </Thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyState message="Nenhum orçamento criado ainda." />
          ) : (
            rows.map((o) => (
              <Tr key={o.id}>
                <Td className="whitespace-nowrap text-xs text-neutral-500">{formatDateTime(o.created_at)}</Td>
                <Td>{o.customer_name_snapshot}</Td>
                <Td>{o.seller?.full_name ?? '-'}</Td>
                <Td>{formatBRL(o.final_value)}</Td>
                <Td>{o.installments}x</Td>
                <Td>
                  <OrcamentoStatusBadge status={o.status} />
                </Td>
                <Td>
                  <Link href={`/admin/orcamentos/${o.id}`} className="text-sm font-medium text-brand-navy hover:underline">
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
