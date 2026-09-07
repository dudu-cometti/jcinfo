import Link from 'next/link'
import { requireCustomerSession } from '@/lib/auth/customer-dal'
import { createClient } from '@/lib/supabase/server'
import { logoutCustomer } from '@/app/cliente/login/actions'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatBRL, formatDate, formatDateTime } from '@/lib/utils'

export const metadata = { title: 'Minha conta' }

const SALE_STATUS_TONE: Record<string, 'neutral' | 'green' | 'red' | 'yellow' | 'blue'> = {
  pendente: 'yellow',
  confirmada: 'blue',
  concluida: 'green',
  cancelada: 'neutral',
  estornada: 'red',
}

export default async function CustomerDashboardPage() {
  const session = await requireCustomerSession()
  const supabase = await createClient()

  const [{ data: rank }, { data: sales }, { data: pointsHistory }, { data: preorders }, { data: raffleEntries }] =
    await Promise.all([
      supabase.rpc('get_my_rank'),
      supabase
        .from('sales')
        .select('id, status, total, created_at')
        .eq('customer_id', session.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('points_transactions')
        .select('id, type, points, reason, created_at')
        .eq('customer_id', session.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('preorder_signups')
        .select('id, converted, created_at, campaign:preorder_campaigns(name, slug, status)')
        .eq('customer_id', session.id),
      supabase
        .from('raffle_entries')
        .select('id, raffle:raffles(name, status, raffle_date)')
        .eq('customer_id', session.id),
    ])

  type PreorderRow = {
    id: string
    converted: boolean
    created_at: string
    campaign: { name: string; slug: string; status: string } | null
  }
  const preorderRows = (preorders ?? []) as unknown as PreorderRow[]

  type RaffleEntryRow = { id: string; raffle: { name: string; status: string; raffle_date: string } | null }
  const raffleRows = (raffleEntries ?? []) as unknown as RaffleEntryRow[]

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Olá, {session.name}</h1>
          <p className="text-sm text-neutral-500">{session.email}</p>
        </div>
        <form action={logoutCustomer}>
          <button type="submit" className="text-sm text-neutral-500 hover:text-neutral-900">
            Sair
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4 text-center">
          <p className="text-xs text-neutral-500">Pontos</p>
          <p className="text-2xl font-semibold text-neutral-900">{session.points.toLocaleString('pt-BR')}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-neutral-500">Ranking</p>
          <p className="text-2xl font-semibold text-neutral-900">#{rank ?? '-'}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-neutral-500">Total comprado</p>
          <p className="text-2xl font-semibold text-neutral-900">{formatBRL(session.totalSpent)}</p>
        </Card>
      </div>

      {preorderRows.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Suas pré-vendas</h2>
          <div className="space-y-2">
            {preorderRows.map((signup) => (
              <div key={signup.id} className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4">
                <div>
                  <p className="font-medium text-neutral-900">{signup.campaign?.name}</p>
                  <p className="text-xs text-neutral-500">Inscrito em {formatDate(signup.created_at)}</p>
                </div>
                <Badge tone={signup.converted ? 'green' : 'blue'}>
                  {signup.converted ? 'Convertido' : 'Na lista de espera'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {raffleRows.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Sorteios que você participa</h2>
          <ul className="flex flex-wrap gap-2">
            {raffleRows.map((entry) => (
              <Badge key={entry.id} tone={entry.raffle?.status === 'aberto' ? 'blue' : 'neutral'}>
                {entry.raffle?.name}
              </Badge>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Suas compras</h2>
        <Table>
          <Thead>
            <Th>Data</Th>
            <Th>Status</Th>
            <Th>Total</Th>
          </Thead>
          <tbody>
            {!sales || sales.length === 0 ? (
              <EmptyState message="Nenhuma compra registrada ainda." />
            ) : (
              sales.map((sale) => (
                <Tr key={sale.id}>
                  <Td className="text-xs text-neutral-500">{formatDateTime(sale.created_at)}</Td>
                  <Td>
                    <Badge tone={SALE_STATUS_TONE[sale.status]}>{sale.status}</Badge>
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
              <EmptyState message="Nenhuma movimentação de pontos ainda." />
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

      <div className="flex justify-center gap-4 text-sm text-neutral-500">
        <Link href="/campanhas" className="hover:underline">
          Campanhas de pontos
        </Link>
        <Link href="/sorteios" className="hover:underline">
          Sorteios
        </Link>
        <Link href="/pre-venda" className="hover:underline">
          Pré-vendas
        </Link>
      </div>
    </div>
  )
}
