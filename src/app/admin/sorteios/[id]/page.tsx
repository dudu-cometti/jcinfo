import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
      supabase.from('raffle_entries').select('id, customer:customers(name, phone)').eq('raffle_id', id),
      supabase
        .from('raffle_winners')
        .select('id, drawn_at, notes, customer:customers(name, phone), drawn_by_profile:profiles(full_name)')
        .eq('raffle_id', id),
    ])

  if (!raffle) notFound()

  type EntryRow = { id: string; customer: { name: string; phone: string } | null }
  const entryRows = (entries ?? []) as unknown as EntryRow[]

  type WinnerRow = {
    id: string
    drawn_at: string
    notes: string | null
    customer: { name: string; phone: string } | null
    drawn_by_profile: { full_name: string } | null
  }
  const winnerRows = (winners ?? []) as unknown as WinnerRow[]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-neutral-900">{raffle.name}</h1>
          <Badge>{raffle.status}</Badge>
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
          {entryRows.length === 0 ? (
            <p className="text-sm text-neutral-400">Nenhum participante ainda.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {entryRows.map((entry) => (
                <Badge key={entry.id}>{entry.customer?.name}</Badge>
              ))}
            </ul>
          )}
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
