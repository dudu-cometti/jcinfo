import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { listOrcamentos } from '@/lib/data/orcamentos'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { OrcamentoStatusBadge } from '@/components/orcamentos/OrcamentoStatusBadge'
import { formatBRL, formatDateTime } from '@/lib/utils'

export const metadata = { title: 'Orçamentos' }

export default async function VendedorOrcamentosPage() {
  const session = await requireRole('admin', 'vendedor')
  const orcamentos = await listOrcamentos(session)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">Meus orçamentos</h1>
        <Link href="/vendedor/orcamentos/novo">
          <Button>Novo orçamento</Button>
        </Link>
      </div>

      <Table>
        <Thead>
          <Th>Data</Th>
          <Th>Cliente</Th>
          <Th>Total</Th>
          <Th>Parcelas</Th>
          <Th>Validade</Th>
          <Th>Status</Th>
          <Th></Th>
        </Thead>
        <tbody>
          {orcamentos.length === 0 ? (
            <EmptyState message="Nenhum orçamento criado ainda." />
          ) : (
            orcamentos.map((o) => (
              <Tr key={o.id}>
                <Td className="whitespace-nowrap text-xs text-neutral-500">{formatDateTime(o.created_at)}</Td>
                <Td>{o.customer_name_snapshot}</Td>
                <Td>{formatBRL(o.final_value)}</Td>
                <Td>{o.installments}x</Td>
                <Td className="whitespace-nowrap text-xs">{o.expires_at ? formatDateTime(o.expires_at) : '-'}</Td>
                <Td>
                  <OrcamentoStatusBadge status={o.status} />
                </Td>
                <Td>
                  <Link href={`/vendedor/orcamentos/${o.id}`} className="text-sm font-medium text-brand-navy hover:underline">
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
