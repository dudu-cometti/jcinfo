import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatBRL } from '@/lib/utils'

export const metadata = { title: 'Ranking de pontos' }

export default async function AdminPontosPage() {
  const supabase = await createClient()
  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, phone, points, total_spent')
    .order('points', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-neutral-900">Ranking de pontos</h1>
      <Table>
        <Thead>
          <Th>#</Th>
          <Th>Cliente</Th>
          <Th>Telefone</Th>
          <Th>Pontos</Th>
          <Th>Total comprado</Th>
        </Thead>
        <tbody>
          {!customers || customers.length === 0 ? (
            <EmptyState message="Nenhum cliente com pontos ainda." />
          ) : (
            customers.map((customer, index) => (
              <Tr key={customer.id}>
                <Td className="font-semibold text-neutral-400">{index + 1}</Td>
                <Td>
                  <Link href={`/admin/clientes/${customer.id}`} className="font-medium text-neutral-900 hover:underline">
                    {customer.name}
                  </Link>
                </Td>
                <Td>{customer.phone}</Td>
                <Td className="font-semibold">{customer.points.toLocaleString('pt-BR')}</Td>
                <Td>{formatBRL(customer.total_spent)}</Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  )
}
