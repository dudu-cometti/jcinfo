import { notFound } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { CopyLinkButton } from '@/components/ui/copy-link-button'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils'
import { RaffleForm } from '../RaffleForm'
import { RaffleEntryForm } from './RaffleEntryForm'
import { DrawWinnerButton } from './DrawWinnerButton'
import { updateRaffle } from '@/lib/actions/raffles'

export const metadata = { title: 'Sorteio' }

export default async function RaffleDetailPage({ params }: PageProps<'/admin/sorteios/[id]'>) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: raffle }, { data: rewards }, { data: campaigns }, { data: entries }, { data: winners }] =
    await Promise.all([
      supabase.from('raffles').select('*').eq('id', id).single(),
      supabase.from('rewards').select('id, name').order('name'),
      supabase.from('point_campaigns').select('id, name').order('name'),
      supabase
        .from('raffle_entries')
        .select('id, created_at, customer:customers(name, phone)')
        .eq('raffle_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('raffle_winners')
        .select('id, drawn_at, notes, customer:customers(name, phone), drawn_by_profile:profiles(full_name)')
        .eq('raffle_id', id),
    ])

  if (!raffle) notFound()

  type EntryRow = { id: string; created_at: string; customer: { name: string; phone: string } | null }
  const entryRows = (entries ?? []) as unknown as EntryRow[]

  type WinnerRow = {
    id: string
    drawn_at: string
    notes: string | null
    customer: { name: string; phone: string } | null
    drawn_by_profile: { full_name: string } | null
  }
  const winnerRows = (winners ?? []) as unknown as WinnerRow[]

  const publicPath = `/sorteios#${raffle.id}`

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold text-neutral-900">{raffle.name}</h1>
          <Badge>{raffle.status}</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm">
          <a href={publicPath} target="_blank" rel="noopener noreferrer" className="truncate font-medium text-brand-navy hover:underline">
            Ver página pública
          </a>
          <CopyLinkButton path={publicPath} />
        </div>

        {winnerRows.length > 0 && (
          <Card className="border-green-200 bg-green-50">
            <h2 className="mb-2 text-sm font-semibold text-green-800">Resultado</h2>
            {winnerRows.map((w) => (
              <p key={w.id} className="text-sm text-green-700">
                <strong>{w.customer?.name}</strong> ({w.customer?.phone}), sorteado em{' '}
                {formatDateTime(w.drawn_at)} por {w.drawn_by_profile?.full_name}
              </p>
            ))}
          </Card>
        )}

        {raffle.status === 'aberto' && (
          <Card>
            <h2 className="mb-3 text-sm font-semibold text-neutral-900">Realizar sorteio</h2>
            <p className="mb-3 text-sm text-neutral-500">{entryRows.length} participante(s) inscrito(s).</p>
            <DrawWinnerButton raffleId={raffle.id} entryCount={entryRows.length} />
          </Card>
        )}

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Participantes ({entryRows.length})</h2>
          {raffle.status === 'aberto' && (
            <div className="mb-4">
              <RaffleEntryForm raffleId={raffle.id} />
            </div>
          )}
          <Table>
            <Thead>
              <Th>Nome</Th>
              <Th>Telefone</Th>
              <Th>Inscrito em</Th>
            </Thead>
            <tbody>
              {entryRows.length === 0 ? (
                <EmptyState message="Nenhum participante ainda." />
              ) : (
                entryRows.map((entry) => (
                  <Tr key={entry.id}>
                    <Td className="font-medium text-neutral-900">{entry.customer?.name}</Td>
                    <Td>{entry.customer?.phone}</Td>
                    <Td className="text-xs text-neutral-500">{formatDateTime(entry.created_at)}</Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>
      </div>

      <Card className="h-fit">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Editar sorteio</h2>
        <RaffleForm
          action={updateRaffle.bind(null, raffle.id)}
          rewards={rewards ?? []}
          campaigns={campaigns ?? []}
          defaultValues={raffle}
          submitLabel="Salvar alterações"
        />
      </Card>
    </div>
  )
}
