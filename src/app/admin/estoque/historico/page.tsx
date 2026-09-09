import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { Field, Input, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'

export const metadata = { title: 'Histórico de estoque' }

const MOVEMENT_LABELS: Record<string, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
  ajuste: 'Ajuste',
  venda: 'Venda',
  cancelamento: 'Cancelamento',
  estorno: 'Estorno',
}

type SearchParams = {
  product_id?: string
  type?: string
  from?: string
  to?: string
}

export default async function EstoqueHistoricoPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('inventory_movements')
    .select(
      'id, type, quantity, reason, created_at, product:products(name), variant:product_variants(color_name), user:profiles(full_name)',
    )
    .order('created_at', { ascending: false })
    .limit(200)

  if (params.product_id) query = query.eq('product_id', params.product_id)
  if (params.type) query = query.eq('type', params.type)
  if (params.from) query = query.gte('created_at', params.from)
  if (params.to) query = query.lte('created_at', params.to)

  const [{ data: movementsData }, { data: products }] = await Promise.all([
    query,
    supabase.from('products').select('id, name').order('name'),
  ])

  type MovementRow = {
    id: string
    type: string
    quantity: number
    reason: string | null
    created_at: string
    product: { name: string } | null
    variant: { color_name: string } | null
    user: { full_name: string } | null
  }
  const movements = (movementsData ?? []) as unknown as MovementRow[]

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-neutral-900">Histórico de estoque</h1>

      <Card>
        <form className="grid grid-cols-1 gap-4 sm:grid-cols-4" method="get">
          <Field label="Produto" htmlFor="product_id">
            <Select id="product_id" name="product_id" defaultValue={params.product_id ?? ''}>
              <option value="">Todos</option>
              {(products ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo" htmlFor="type">
            <Select id="type" name="type" defaultValue={params.type ?? ''}>
              <option value="">Todos</option>
              {Object.entries(MOVEMENT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="De" htmlFor="from">
            <Input id="from" name="from" type="date" defaultValue={params.from ?? ''} />
          </Field>
          <Field label="Até" htmlFor="to">
            <Input id="to" name="to" type="date" defaultValue={params.to ?? ''} />
          </Field>
          <div className="col-span-full">
            <Button type="submit">Filtrar</Button>
          </div>
        </form>
      </Card>

      <Table>
        <Thead>
          <Th>Data</Th>
          <Th>Produto</Th>
          <Th>Cor</Th>
          <Th>Tipo</Th>
          <Th>Quantidade</Th>
          <Th>Responsável</Th>
          <Th>Motivo</Th>
        </Thead>
        <tbody>
          {movements.length === 0 ? (
            <EmptyState message="Nenhuma movimentação encontrada para este filtro." />
          ) : (
            movements.map((m) => (
              <Tr key={m.id}>
                <Td className="whitespace-nowrap text-xs text-neutral-500">{formatDateTime(m.created_at)}</Td>
                <Td>{m.product?.name ?? '-'}</Td>
                <Td>{m.variant?.color_name ?? '-'}</Td>
                <Td>
                  <Badge tone={m.quantity < 0 ? 'red' : 'green'}>{MOVEMENT_LABELS[m.type] ?? m.type}</Badge>
                </Td>
                <Td className={m.quantity < 0 ? 'text-red-600' : 'text-green-700'}>
                  {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                </Td>
                <Td>{m.user?.full_name ?? '-'}</Td>
                <Td className="text-xs text-neutral-500">{m.reason ?? '-'}</Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  )
}
