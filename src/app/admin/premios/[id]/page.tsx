import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { RewardForm } from '../RewardForm'
import { updateReward } from '@/lib/actions/rewards'

export const metadata = { title: 'Editar prêmio' }

export default async function EditRewardPage({ params }: PageProps<'/admin/premios/[id]'>) {
  const { id } = await params
  const supabase = await createClient()
  const { data: reward } = await supabase.from('rewards').select('*').eq('id', id).single()

  if (!reward) notFound()

  return (
    <Card className="max-w-lg">
      <h1 className="mb-4 text-lg font-semibold text-neutral-900">Editar prêmio</h1>
      <RewardForm action={updateReward.bind(null, reward.id)} defaultValues={reward} submitLabel="Salvar alterações" />
    </Card>
  )
}
