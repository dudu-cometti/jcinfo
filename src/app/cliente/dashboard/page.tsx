import Link from 'next/link'
import Image from 'next/image'
import { requireCustomerSession } from '@/lib/auth/customer-dal'
import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/data/settings'
import { logoutCustomer } from '@/app/cliente/login/actions'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { StarIcon, TrophyIcon, WalletIcon } from '@/components/ui/icons'
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
  const [session, settings] = await Promise.all([requireCustomerSession(), getSiteSettings()])
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
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center">
            <Image src="/logo.jpg" alt={settings.site_name} width={170} height={50} className="h-9 w-auto" />
          </Link>
          <form action={logoutCustomer}>
            <button type="submit" className="text-sm text-neutral-500 transition hover:text-neutral-900">
              Sair
            </button>
          </form>
        </div>
      </header>

      <div className="bg-gradient-to-br from-brand-navy to-brand-teal">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-8">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl font-semibold text-white ring-1 ring-inset ring-white/25">
            {session.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white/70">Olá,</p>
            <h1 className="truncate text-xl font-semibold text-white">{session.name}</h1>
            <p className="truncate text-sm text-white/70">{session.email}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-cyan/15 text-brand-navy">
              <StarIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-neutral-500">Pontos</p>
              <p className="text-xl font-semibold text-neutral-900">{session.points.toLocaleString('pt-BR')}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-cyan/15 text-brand-navy">
              <TrophyIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-neutral-500">Ranking</p>
              <p className="text-xl font-semibold text-neutral-900">#{rank ?? '-'}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-cyan/15 text-brand-navy">
              <WalletIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs text-neutral-500">Total comprado</p>
              <p className="text-xl font-semibold text-neutral-900">{formatBRL(session.totalSpent)}</p>
            </div>
          </Card>
        </div>

        {preorderRows.length > 0 && (
          <section>
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
          </section>
        )}

        {raffleRows.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">Sorteios que você participa</h2>
            <ul className="flex flex-wrap gap-2">
              {raffleRows.map((entry) => (
                <Badge key={entry.id} tone={entry.raffle?.status === 'aberto' ? 'blue' : 'neutral'}>
                  {entry.raffle?.name}
                </Badge>
              ))}
            </ul>
          </section>
        )}

        <section>
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
        </section>

        <section>
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
        </section>

        <div className="flex flex-wrap justify-center gap-2 pb-4 text-sm">
          <Link
            href="/campanhas"
            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-neutral-600 transition hover:border-brand-navy/30 hover:text-brand-navy"
          >
            Campanhas de pontos
          </Link>
          <Link
            href="/sorteios"
            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-neutral-600 transition hover:border-brand-navy/30 hover:text-brand-navy"
          >
            Sorteios
          </Link>
          <Link
            href="/pre-venda"
            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-neutral-600 transition hover:border-brand-navy/30 hover:text-brand-navy"
          >
            Pré-vendas
          </Link>
        </div>
      </div>
    </div>
  )
}
