import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { CampaignForm } from './CampaignForm'
import { createCampaign, deleteCampaign } from '@/lib/actions/campaigns'

export const metadata = { title: 'Campanhas' }

const STATUS_TONE: Record<string, 'neutral' | 'green' | 'blue'> = {
  rascunho: 'neutral',
  ativa: 'green',
  encerrada: 'blue',
}

export default async function AdminCampanhasPage() {
  const supabase = await createClient()
  const [{ data: campaigns }, { data: rewards }] = await Promise.all([
    supabase.from('point_campaigns').select('*').order('created_at', { ascending: false }),
    supabase.from('rewards').select('id, name').eq('status', 'ativo').order('name'),
  ])

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-lg font-semibold text-neutral-900">Campanhas de pontos</h1>
        <Table>
          <Thead>
            <Th>Nome</Th>
            <Th>Mínimo</Th>
            <Th>Período</Th>
            <Th>Status</Th>
            <Th />
          </Thead>
          <tbody>
            {!campaigns || campaigns.length === 0 ? (
              <EmptyState message="Nenhuma campanha cadastrada." />
            ) : (
              campaigns.map((campaign) => (
                <Tr key={campaign.id}>
                  <Td className="font-medium text-neutral-900">
                    {campaign.name}
                    {campaign.featured && <Badge tone="yellow" className="ml-2">Destaque</Badge>}
                  </Td>
                  <Td>{campaign.min_points.toLocaleString('pt-BR')}</Td>
                  <Td className="text-xs text-neutral-500">
                    {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[campaign.status]}>{campaign.status}</Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/campanhas/${campaign.id}`} className="text-sm text-neutral-600 hover:underline">
                        Editar
                      </Link>
                      <form action={deleteCampaign.bind(null, campaign.id)}>
                        <button type="submit" className="text-sm text-red-600 hover:underline">
                          Excluir
                        </button>
                      </form>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <Card className="h-fit">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Nova campanha</h2>
        <CampaignForm action={createCampaign} rewards={rewards ?? []} submitLabel="Criar campanha" />
      </Card>
    </div>
  )
}
