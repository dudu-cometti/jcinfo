import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatBRL, formatDateTime } from '@/lib/utils'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { updateCustomer } from '@/lib/actions/customers'

export const metadata = { title: 'Cliente' }

const STATUS_TONE: Record<string, 'neutral' | 'green' | 'red' | 'yellow' | 'blue'> = {
  pendente: 'yellow',
  confirmada: 'blue',
  concluida: 'green',
  cancelada: 'neutral',
  estornada: 'red',
}

export default async function VendedorCustomerDetailPage({ params }: PageProps<'/vendedor/clientes/[id]'>) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: customer }, { data: sales }] = await Promise.all([
    supabase.from('customers').select('*').eq('id', id).single(),
    supabase
      .from('sales')
      .select('id, status, total, created_at')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  if (!customer) notFound()

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <h1 className="text-lg font-semibold text-neutral-900">{customer.name}</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs text-neutral-500">Pontos</p>
            <p className="text-xl font-semibold">{customer.points.toLocaleString('pt-BR')}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-neutral-500">Total comprado</p>
            <p className="text-xl font-semibold">{formatBRL(customer.total_spent)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-neutral-500">Telefone</p>
            <p className="text-xl font-semibold">{customer.phone}</p>
          </Card>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Compras recentes</h2>
          <Table>
            <Thead>
              <Th>Data</Th>
              <Th>Status</Th>
              <Th>Total</Th>
            </Thead>
            <tbody>
              {!sales || sales.length === 0 ? (
                <EmptyState message="Nenhuma compra registrada." />
              ) : (
                sales.map((sale) => (
                  <Tr key={sale.id}>
                    <Td className="text-xs text-neutral-500">{formatDateTime(sale.created_at)}</Td>
                    <Td>
                      <Badge tone={STATUS_TONE[sale.status]}>{sale.status}</Badge>
                    </Td>
                    <Td>{formatBRL(sale.total)}</Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </div>
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
