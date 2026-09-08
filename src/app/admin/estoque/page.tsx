import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatDateTime } from '@/lib/utils'
import { StockAdjustmentForm } from './StockAdjustmentForm'

export const metadata = { title: 'Estoque' }

const MOVEMENT_LABELS: Record<string, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
  venda: 'Venda',
  cancelamento: 'Cancelamento',
  estorno: 'Estorno',
}

export default async function AdminEstoquePage() {
  const supabase = await createClient()

  type MovementRow = {
    id: string
    type: string
    quantity: number
    reason: string | null
    created_at: string
    product: { name: string } | null
  }

  const [{ data: movementsData }, { data: products }, { data: lowStockProducts }] = await Promise.all([
    supabase
      .from('inventory_movements')
      .select('id, type, quantity, reason, created_at, product:products(name)')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('products')
      .select('id, name, sku, variants:product_variants(id, color_name, status)')
      .eq('status', 'ativo')
      .order('name'),
    supabase.from('products').select('id, name, stock, min_stock').eq('status', 'ativo'),
  ])

  const movements = (movementsData ?? []) as unknown as MovementRow[]
  const lowStock = (lowStockProducts ?? []).filter((p) => p.stock <= p.min_stock)
  const productsWithVariants = (products ?? []).map((p) => ({
    ...p,
    variants: (p.variants ?? []).filter((v) => v.status === 'ativo'),
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-neutral-900">Estoque</h1>

      {lowStock.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <h2 className="mb-2 text-sm font-semibold text-red-800">
            {lowStock.length} produto(s) com estoque baixo
          </h2>
          <ul className="flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <Badge key={p.id} tone="red">
                {p.name} ({p.stock})
              </Badge>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Histórico de movimentações</h2>
          <Table>
            <Thead>
              <Th>Data</Th>
              <Th>Produto</Th>
              <Th>Tipo</Th>
              <Th>Quantidade</Th>
              <Th>Motivo</Th>
            </Thead>
            <tbody>
              {!movements || movements.length === 0 ? (
                <EmptyState message="Nenhuma movimentação registrada." />
              ) : (
                movements.map((m) => (
                  <Tr key={m.id}>
                    <Td className="whitespace-nowrap text-xs text-neutral-500">{formatDateTime(m.created_at)}</Td>
                    <Td>{m.product?.name ?? '-'}</Td>
                    <Td>
                      <Badge tone={m.quantity < 0 ? 'red' : 'green'}>{MOVEMENT_LABELS[m.type] ?? m.type}</Badge>
                    </Td>
                    <Td className={m.quantity < 0 ? 'text-red-600' : 'text-green-700'}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </Td>
                    <Td className="text-xs text-neutral-500">{m.reason ?? '-'}</Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        <Card className="h-fit">
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Nova movimentação manual</h2>
          <StockAdjustmentForm products={productsWithVariants} />
        </Card>
      </div>
    </div>
  )
}
