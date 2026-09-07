import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { RaffleSignupForm } from './RaffleSignupForm'

export const metadata: Metadata = {
  title: 'Sorteios',
  description: 'Confira os sorteios abertos e os resultados dos sorteios anteriores.',
}

export default async function SorteiosPage() {
  const supabase = await createClient()
  const { data: raffles } = await supabase
    .from('raffles')
    .select(
      'id, name, description, raffle_date, status, reward:rewards(name), raffle_entries(count), raffle_winners(customer:customers(name))',
    )
    .order('raffle_date', { ascending: false })

  type RaffleRow = {
    id: string
    name: string
    description: string | null
    raffle_date: string
    status: string
    reward: { name: string } | null
    raffle_entries: { count: number }[]
    raffle_winners: { customer: { name: string } | null }[]
  }
  const rows = (raffles ?? []) as unknown as RaffleRow[]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Sorteios</h1>
      {rows.length === 0 ? (
        <p className="text-neutral-500">Nenhum sorteio cadastrado no momento.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rows.map((raffle) => (
            <div key={raffle.id} className="rounded-2xl border border-neutral-200 bg-white p-6">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <Badge tone={raffle.status === 'aberto' ? 'blue' : 'neutral'}>{raffle.status}</Badge>
                <span className="text-xs text-neutral-400">{formatDate(raffle.raffle_date)}</span>
              </div>
              <h2 className="text-lg font-medium text-neutral-900">{raffle.name}</h2>
              <p className="mt-1 text-sm text-neutral-500">{raffle.description}</p>
              {raffle.reward && <p className="mt-2 text-sm text-neutral-700">Prêmio: {raffle.reward.name}</p>}
              <p className="mt-1 text-xs text-neutral-400">
                {raffle.raffle_entries?.[0]?.count ?? 0} participante(s)
              </p>
              {raffle.raffle_winners.length > 0 && (
                <p className="mt-2 text-sm font-medium text-green-700">
                  Vencedor: {raffle.raffle_winners[0].customer?.name}
                </p>
              )}
              {raffle.status === 'aberto' && <RaffleSignupForm raffleId={raffle.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
