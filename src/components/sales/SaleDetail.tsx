import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td } from '@/components/ui/table'
import { formatBRL, formatDateTime } from '@/lib/utils'
import { SaleActions } from './SaleActions'

const STATUS_TONE: Record<string, 'neutral' | 'green' | 'red' | 'yellow' | 'blue'> = {
  pendente: 'yellow',
  confirmada: 'blue',
  concluida: 'green',
  cancelada: 'neutral',
  estornada: 'red',
}

export async function SaleDetail({ saleId, isAdmin }: { saleId: string; isAdmin: boolean }) {
  const supabase = await createClient()

  const [{ data: sale }, { data: items }] = await Promise.all([
    supabase
      .from('sales')
      .select(
        'id, status, subtotal, discount, total, notes, origin, points_generated, created_at, confirmed_at, cancelled_at, customer:customers(id, name, phone), seller:profiles(full_name)',
      )
      .eq('id', saleId)
      .single(),
    supabase
      .from('sale_items')
      .select('id, quantity, unit_price, subtotal, product:products(name, sku)')
      .eq('sale_id', saleId),
  ])

  if (!sale) notFound()

  type SaleRow = {
    id: string
    status: 'pendente' | 'confirmada' | 'concluida' | 'cancelada' | 'estornada'
    subtotal: number
    discount: number
    total: number
    notes: string | null
    origin: string
    points_generated: number
    created_at: string
    confirmed_at: string | null
    cancelled_at: string | null
    customer: { id: string; name: string; phone: string } | null
    seller: { full_name: string } | null
  }
  const saleRow = sale as unknown as SaleRow

  type ItemRow = {
    id: string
    quantity: number
    unit_price: number
    subtotal: number
    product: { name: string; sku: string | null } | null
  }
  const itemRows = (items ?? []) as unknown as ItemRow[]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-neutral-900">Venda #{saleRow.id.slice(0, 8)}</h1>
          <Badge tone={STATUS_TONE[saleRow.status]}>{saleRow.status}</Badge>
        </div>
        <SaleActions saleId={saleRow.id} status={saleRow.status} isAdmin={isAdmin} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-neutral-500">Cliente</p>
          <p className="font-medium text-neutral-900">{saleRow.customer?.name ?? '-'}</p>
          <p className="text-xs text-neutral-400">{saleRow.customer?.phone}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-neutral-500">Vendedor</p>
          <p className="font-medium text-neutral-900">{saleRow.seller?.full_name ?? '-'}</p>
          <p className="text-xs text-neutral-400">{formatDateTime(saleRow.created_at)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-neutral-500">Total</p>
          <p className="font-medium text-neutral-900">{formatBRL(saleRow.total)}</p>
          {saleRow.points_generated > 0 && (
            <p className="text-xs text-neutral-400">{saleRow.points_generated} pontos gerados</p>
          )}
        </Card>
      </div>

      <Table>
        <Thead>
          <Th>Produto</Th>
          <Th>Qtd.</Th>
          <Th>Preço unit.</Th>
          <Th>Subtotal</Th>
        </Thead>
        <tbody>
          {itemRows.map((item) => (
            <Tr key={item.id}>
              <Td>
                {item.product?.name}
                {item.product?.sku && <span className="ml-2 text-xs text-neutral-400">{item.product.sku}</span>}
              </Td>
              <Td>{item.quantity}</Td>
              <Td>{formatBRL(item.unit_price)}</Td>
              <Td>{formatBRL(item.subtotal)}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>

      <div className="ml-auto max-w-xs space-y-1 text-sm">
        <div className="flex justify-between text-neutral-500">
          <span>Subtotal</span>
          <span>{formatBRL(saleRow.subtotal)}</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Desconto</span>
          <span>-{formatBRL(saleRow.discount)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold text-neutral-900">
          <span>Total</span>
          <span>{formatBRL(saleRow.total)}</span>
        </div>
      </div>

      {saleRow.notes && (
        <p className="text-sm text-neutral-500">
          <strong>Observações:</strong> {saleRow.notes}
        </p>
      )}
    </div>
  )
}
