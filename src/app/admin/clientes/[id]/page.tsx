import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatBRL, formatDate, formatDateTime } from '@/lib/utils'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { updateCustomer } from '@/lib/actions/customers'

export const metadata = { title: 'Cliente' }

export default async function CustomerDetailPage({ params }: PageProps<'/admin/clientes/[id]'>) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: customer }, { data: sales }, { data: pointsHistory }, { data: raffleEntries }] = await Promise.all([
    supabase.from('customers').select('*').eq('id', id).single(),
    supabase
      .from('sales')
      .select('id, status, total, created_at, seller:profiles(full_name)')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('points_transactions')
      .select('id, type, points, reason, created_at')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('raffle_entries')
      .select('id, raffle:raffles(name, status, raffle_date)')
      .eq('customer_id', id),
  ])

  if (!customer) notFound()

  const { count: rankAhead } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .gt('points', customer.points)

  type SaleRow = {
    id: string
    status: string
    total: number
    created_at: string
    seller: { full_name: string } | null
  }
  const salesRows = (sales ?? []) as unknown as SaleRow[]

  type RaffleEntryRow = { id: string; raffle: { name: string; status: string; raffle_date: string } | null }
  const raffleRows = (raffleEntries ?? []) as unknown as RaffleEntryRow[]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-neutral-900">{customer.name}</h1>
          <Badge tone={customer.status === 'ativo' ? 'green' : 'neutral'}>{customer.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-neutral-500">Pontos</p>
            <p className="text-xl font-semibold">{customer.points.toLocaleString('pt-BR')}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-neutral-500">Posição no ranking</p>
            <p className="text-xl font-semibold">#{(rankAhead ?? 0) + 1}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-neutral-500">Total comprado</p>
            <p className="text-xl font-semibold">{formatBRL(customer.total_spent)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-neutral-500">Última compra</p>
            <p className="text-xl font-semibold">
              {customer.last_purchase_at ? formatDate(customer.last_purchase_at) : '—'}
            </p>
          </Card>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Histórico de compras</h2>
          <Table>
            <Thead>
              <Th>Data</Th>
              <Th>Vendedor</Th>
              <Th>Status</Th>
              <Th>Total</Th>
            </Thead>
            <tbody>
              {salesRows.length === 0 ? (
                <EmptyState message="Nenhuma compra registrada." />
              ) : (
                salesRows.map((sale) => (
                  <Tr key={sale.id}>
                    <Td className="text-xs text-neutral-500">{formatDateTime(sale.created_at)}</Td>
                    <Td>{sale.seller?.full_name ?? '—'}</Td>
                    <Td>
                      <Badge>{sale.status}</Badge>
                    </Td>
                    <Td>{formatBRL(sale.total)}</Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Histórico de pontos</h2>
          <Table>
            <Thead>
              <Th>Data</Th>
              <Th>Tipo</Th>
              <Th>Pontos</Th>
              <Th>Motivo</Th>
            </Thead>
            <tbody>
              {!pointsHistory || pointsHistory.length === 0 ? (
                <EmptyState message="Nenhuma movimentação de pontos." />
              ) : (
                pointsHistory.map((p) => (
                  <Tr key={p.id}>
                    <Td className="text-xs text-neutral-500">{formatDateTime(p.created_at)}</Td>
                    <Td>
                      <Badge tone={p.points < 0 ? 'red' : 'green'}>{p.type}</Badge>
                    </Td>
                    <Td className={p.points < 0 ? 'text-red-600' : 'text-green-700'}>
                      {p.points > 0 ? `+${p.points}` : p.points}
                    </Td>
                    <Td className="text-xs text-neutral-500">{p.reason}</Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {raffleRows.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">Sorteios</h2>
            <ul className="flex flex-wrap gap-2">
              {raffleRows.map((entry) => (
                <Badge key={entry.id} tone={entry.raffle?.status === 'aberto' ? 'blue' : 'neutral'}>
                  {entry.raffle?.name}
                </Badge>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Card className="h-fit">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Dados do cliente</h2>
        <CustomerForm
          action={updateCustomer.bind(null, customer.id)}
          defaultValues={{
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            notes: customer.notes,
          }}
          submitLabel="Salvar alterações"
        />
      </Card>
    </div>
  )
}
