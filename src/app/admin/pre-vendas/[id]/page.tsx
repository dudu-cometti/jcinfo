import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatDate, formatDateTime } from '@/lib/utils'
import { PreorderCampaignForm } from '../PreorderCampaignForm'
import { updatePreorderCampaign, deletePreorderCampaign } from '../actions'
import { ConvertedToggle } from './ConvertedToggle'
import { CampaignImageManager } from './CampaignImageManager'

export const metadata = { title: 'Pré-venda' }

export default async function EditPreorderCampaignPage({
  params,
}: PageProps<'/admin/pre-vendas/[id]'>) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: campaign }, { data: rewards }, { data: signups }] = await Promise.all([
    supabase.from('preorder_campaigns').select('*').eq('id', id).single(),
    supabase.from('rewards').select('id, name').order('name'),
    supabase
      .from('preorder_signups')
      .select('id, converted, created_at, customer:customers(name, phone)')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!campaign) notFound()

  type SignupRow = {
    id: string
    converted: boolean
    created_at: string
    customer: { name: string; phone: string } | null
  }
  const signupRows = (signups ?? []) as unknown as SignupRow[]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-neutral-900">{campaign.name}</h1>
          <form action={deletePreorderCampaign.bind(null, campaign.id)}>
            <button type="submit" className="text-sm text-red-600 hover:underline">
              Excluir pré-venda
            </button>
          </form>
        </div>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">
            Inscritos ({signupRows.length})
          </h2>
          <Table>
            <Thead>
              <Th>Nome</Th>
              <Th>Telefone</Th>
              <Th>Data</Th>
              <Th>Benefício</Th>
            </Thead>
            <tbody>
              {signupRows.length === 0 ? (
                <EmptyState message="Ninguém se inscreveu ainda." />
              ) : (
                signupRows.map((signup) => (
                  <Tr key={signup.id}>
                    <Td className="font-medium text-neutral-900">{signup.customer?.name}</Td>
                    <Td>{signup.customer?.phone}</Td>
                    <Td className="text-xs text-neutral-500">{formatDateTime(signup.created_at)}</Td>
                    <Td>
                      <ConvertedToggle signupId={signup.id} converted={signup.converted} />
                    </Td>
                  </Tr>
                ))
              )}
            </tbody>
          </Table>
        </Card>
      </div>

      <div className="h-fit space-y-6">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Imagens</h2>
          <CampaignImageManager
            campaignId={campaign.id}
            imageUrl={campaign.image_url}
            imageUrlMobile={campaign.image_url_mobile}
          />
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-neutral-900">Editar pré-venda</h2>
          <PreorderCampaignForm
            action={updatePreorderCampaign.bind(null, campaign.id)}
            rewards={rewards ?? []}
            defaultValues={{
              ...campaign,
              expected_date: campaign.expected_date ? campaign.expected_date.slice(0, 10) : null,
            }}
            submitLabel="Salvar alterações"
          />
          {campaign.expected_date && (
            <p className="mt-3 text-xs text-neutral-400">Chegada prevista: {formatDate(campaign.expected_date)}</p>
          )}
        </Card>
      </div>
    </div>
  )
}
