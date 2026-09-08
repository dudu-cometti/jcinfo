import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatDateTime } from '@/lib/utils'
import { RaffleForm } from './RaffleForm'
import { createRaffle } from '@/lib/actions/raffles'

export const metadata = { title: 'Sorteios' }

const STATUS_TONE: Record<string, 'blue' | 'green' | 'neutral'> = {
  aberto: 'blue',
  encerrado: 'green',
  cancelado: 'neutral',
}

export default async function AdminSorteiosPage() {
  const supabase = await createClient()
  const [{ data: raffles }, { data: rewards }, { data: campaigns }] = await Promise.all([
    supabase
      .from('raffles')
      .select('id, name, raffle_date, status, reward:rewards(name), raffle_entries(count)')
      .order('raffle_date', { ascending: false }),
    supabase.from('rewards').select('id, name').order('name'),
    supabase.from('point_campaigns').select('id, name').order('name'),
  ])

  type RaffleRow = {
    id: string
    name: string
    raffle_date: string
    status: string
    reward: { name: string } | null
    raffle_entries: { count: number }[]
  }
  const rows = (raffles ?? []) as unknown as RaffleRow[]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-lg font-semibold text-neutral-900">Sorteios</h1>
        <Table>
          <Thead>
            <Th>Nome</Th>
            <Th>Prêmio</Th>
            <Th>Data</Th>
            <Th>Inscritos</Th>
            <Th>Status</Th>
            <Th />
          </Thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyState message="Nenhum sorteio cadastrado." />
            ) : (
              rows.map((raffle) => (
                <Tr key={raffle.id}>
                  <Td className="font-medium text-neutral-900">{raffle.name}</Td>
                  <Td>{raffle.reward?.name ?? '-'}</Td>
                  <Td className="text-xs text-neutral-500">{formatDateTime(raffle.raffle_date)}</Td>
                  <Td>{raffle.raffle_entries?.[0]?.count ?? 0}</Td>
                  <Td>
                    <Badge tone={STATUS_TONE[raffle.status]}>{raffle.status}</Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/sorteios/${raffle.id}#participantes`}
                        className="text-sm text-neutral-600 hover:underline"
                      >
                        Ver inscritos
                      </Link>
                      <a
                        href={`/sorteios#${raffle.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-neutral-600 hover:underline"
                      >
                        Ver página
                      </a>
                      <Link href={`/admin/sorteios/${raffle.id}`} className="text-sm text-neutral-600 hover:underline">
                        Gerenciar
                      </Link>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <Card className="h-fit">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Novo sorteio</h2>
        <RaffleForm action={createRaffle} rewards={rewards ?? []} campaigns={campaigns ?? []} submitLabel="Criar sorteio" />
      </Card>
    </div>
  )
}
