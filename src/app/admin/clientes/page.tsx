import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatBRL, formatDate } from '@/lib/utils'

export const metadata = { title: 'Clientes' }

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminClientesPage({ searchParams }: PageProps<'/admin/clientes'>) {
  const params = await searchParams
  const q = firstParam(params.q) ?? ''

  const supabase = await createClient()
  let query = supabase
    .from('customers')
    .select('id, name, phone, email, points, total_spent, last_purchase_at, status')
    .order('created_at', { ascending: false })
    .limit(50)

  if (q) {
    const digitsOnly = q.replace(/\D/g, '')
    query = digitsOnly.length >= 3
      ? query.or(`name.ilike.%${q}%,phone.ilike.%${digitsOnly}%`)
      : query.ilike('name', `%${q}%`)
  }

  const { data: customers } = await query

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-neutral-900">Clientes</h1>
        <Link href="/admin/clientes/novo">
          <Button>+ Novo cliente</Button>
        </Link>
      </div>

      <form className="flex gap-3">
        <Input name="q" defaultValue={q} placeholder="Buscar por nome ou telefone..." className="max-w-sm" />
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      <Table>
        <Thead>
          <Th>Nome</Th>
          <Th>Telefone</Th>
          <Th>Pontos</Th>
          <Th>Total comprado</Th>
          <Th>Última compra</Th>
          <Th>Status</Th>
          <Th />
        </Thead>
        <tbody>
          {!customers || customers.length === 0 ? (
            <EmptyState message="Nenhum cliente encontrado." />
          ) : (
            customers.map((customer) => (
              <Tr key={customer.id}>
                <Td className="font-medium text-neutral-900">{customer.name}</Td>
                <Td>{customer.phone}</Td>
                <Td>{customer.points.toLocaleString('pt-BR')}</Td>
                <Td>{formatBRL(customer.total_spent)}</Td>
                <Td>{customer.last_purchase_at ? formatDate(customer.last_purchase_at) : '—'}</Td>
                <Td>
                  <Badge tone={customer.status === 'ativo' ? 'green' : 'neutral'}>{customer.status}</Badge>
                </Td>
                <Td>
                  <Link href={`/admin/clientes/${customer.id}`} className="text-sm text-neutral-600 hover:underline">
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
