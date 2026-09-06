import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Campanhas de pontos',
  description: 'Confira as campanhas de pontos ativas e os prêmios disponíveis.',
}

export default async function CampanhasPage() {
  const supabase = await createClient()
  const { data: campaigns } = await supabase
    .from('point_campaigns')
    .select('id, name, description, min_points, start_date, end_date, status, campaign_rewards(reward:rewards(name, image_url))')
    .in('status', ['ativa', 'encerrada'])
    .order('min_points')

  type CampaignRow = {
    id: string
    name: string
    description: string | null
    min_points: number
    start_date: string
    end_date: string
    status: string
    campaign_rewards: { reward: { name: string; image_url: string | null } | null }[]
  }
  const rows = (campaigns ?? []) as unknown as CampaignRow[]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Campanhas de pontos</h1>
      {rows.length === 0 ? (
        <p className="text-neutral-500">Nenhuma campanha disponível no momento.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rows.map((campaign) => (
            <div key={campaign.id} className="rounded-2xl border border-neutral-200 bg-white p-6">
              <div className="mb-2 flex items-center justify-between">
                <Badge tone={campaign.status === 'ativa' ? 'green' : 'neutral'}>{campaign.status}</Badge>
                <span className="text-xs text-neutral-400">
                  até {formatDate(campaign.end_date)}
                </span>
              </div>
              <h2 className="text-lg font-medium text-neutral-900">{campaign.name}</h2>
              <p className="mt-1 text-sm text-neutral-500">{campaign.description}</p>
              <p className="mt-3 text-sm font-medium text-neutral-700">
                Junte {campaign.min_points.toLocaleString('pt-BR')} pontos e ganhe:
              </p>
              <ul className="mt-1 flex flex-wrap gap-2">
                {campaign.campaign_rewards.map((cr, i) => (
                  <Badge key={i}>{cr.reward?.name}</Badge>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
