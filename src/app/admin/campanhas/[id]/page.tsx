import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { CampaignForm } from '../CampaignForm'
import { updateCampaign } from '@/lib/actions/campaigns'

export const metadata = { title: 'Editar campanha' }

export default async function EditCampaignPage({ params }: PageProps<'/admin/campanhas/[id]'>) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: campaign }, { data: rewards }, { data: campaignRewards }] = await Promise.all([
    supabase.from('point_campaigns').select('*').eq('id', id).single(),
    supabase.from('rewards').select('id, name').order('name'),
    supabase.from('campaign_rewards').select('reward_id').eq('campaign_id', id),
  ])

  if (!campaign) notFound()

  return (
    <Card className="max-w-xl">
      <h1 className="mb-4 text-lg font-semibold text-neutral-900">Editar campanha</h1>
      <CampaignForm
        action={updateCampaign.bind(null, campaign.id)}
        rewards={rewards ?? []}
        selectedRewardIds={(campaignRewards ?? []).map((r) => r.reward_id)}
        defaultValues={campaign}
        submitLabel="Salvar alterações"
      />
    </Card>
  )
}
