import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Entradas de estoque' }

export default async function EntradasPage() {
  const supabase = await createClient()

  const { data: receipts } = await supabase
    .from('stock_receipts')
    .select('id, supplier_name, document_number, received_at, created_at, reversed_at')
    .order('received_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">Entradas de estoque</h1>
        <Link href="/admin/entradas/nova">
          <Button>Nova entrada</Button>
        </Link>
      </div>

      <Table>
        <Thead>
          <Th>Data</Th>
          <Th>Fornecedor</Th>
          <Th>Documento</Th>
          <Th>Status</Th>
          <Th></Th>
        </Thead>
        <tbody>
          {!receipts || receipts.length === 0 ? (
            <EmptyState message="Nenhuma entrada registrada." />
          ) : (
            receipts.map((r) => (
              <Tr key={r.id}>
                <Td className="whitespace-nowrap">{formatDate(r.received_at)}</Td>
                <Td>{r.supplier_name}</Td>
                <Td>{r.document_number ?? '-'}</Td>
                <Td>{r.reversed_at ? <Badge tone="red">Estornada</Badge> : <Badge tone="green">Ativa</Badge>}</Td>
                <Td>
                  <Link href={`/admin/entradas/${r.id}`} className="text-sm font-medium text-brand-navy hover:underline">
                    Ver detalhes
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
