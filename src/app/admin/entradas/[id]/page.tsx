import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatBRL, formatDate, formatDateTime } from '@/lib/utils'
import { ReverseReceiptButton } from './ReverseReceiptButton'

export const metadata = { title: 'Entrada de estoque' }

export default async function EntradaDetailPage({ params }: PageProps<'/admin/entradas/[id]'>) {
  const { id } = await params
  const supabase = await createClient()

  const { data: receipt } = await supabase
    .from('stock_receipts')
    .select('id, supplier_name, document_number, received_at, notes, created_at, reversed_at, reversal_reason')
    .eq('id', id)
    .maybeSingle()

  if (!receipt) notFound()

  const { data: items } = await supabase
    .from('stock_receipt_items')
    .select('id, product_id, variant_id, quantity, unit_cost, product:products(name), variant:product_variants(color_name)')
    .eq('receipt_id', id)

  type ItemRow = {
    id: string
    quantity: number
    unit_cost: number
    product: { name: string } | null
    variant: { color_name: string } | null
  }
  const rows = (items ?? []) as unknown as ItemRow[]
  const totalCost = rows.reduce((sum, r) => sum + r.unit_cost * r.quantity, 0)

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-neutral-900">Entrada de {formatDate(receipt.received_at)}</h1>
        {receipt.reversed_at && <Badge tone="red">Estornada</Badge>}
      </div>

      <Card className="space-y-1 text-sm">
        <p>
          <span className="text-neutral-500">Fornecedor:</span> {receipt.supplier_name}
        </p>
        <p>
          <span className="text-neutral-500">Documento:</span> {receipt.document_number ?? '-'}
        </p>
        <p>
          <span className="text-neutral-500">Registrado em:</span> {formatDateTime(receipt.created_at)}
        </p>
        {receipt.notes && (
          <p>
            <span className="text-neutral-500">Observação:</span> {receipt.notes}
          </p>
        )}
        {receipt.reversed_at && (
          <p className="text-red-600">
            <span className="text-neutral-500">Estornada em:</span> {formatDateTime(receipt.reversed_at)} — motivo:{' '}
            {receipt.reversal_reason}
          </p>
        )}
      </Card>

      <Table>
        <Thead>
          <Th>Produto</Th>
          <Th>Cor</Th>
          <Th>Quantidade</Th>
          <Th>Custo unitário</Th>
          <Th>Total</Th>
        </Thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyState message="Nenhum item." />
          ) : (
            rows.map((item) => (
              <Tr key={item.id}>
                <Td>{item.product?.name ?? '-'}</Td>
                <Td>{item.variant?.color_name ?? '-'}</Td>
                <Td>+{item.quantity}</Td>
                <Td>{formatBRL(item.unit_cost)}</Td>
                <Td>{formatBRL(item.unit_cost * item.quantity)}</Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>

      <p className="text-right text-sm font-semibold text-neutral-900">Total: {formatBRL(totalCost)}</p>

      {!receipt.reversed_at && <ReverseReceiptButton receiptId={receipt.id} />}
    </div>
  )
}
