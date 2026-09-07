import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { PreorderCampaignForm } from './PreorderCampaignForm'
import { createPreorderCampaign } from './actions'

export const metadata = { title: 'Pré-vendas' }

const STATUS_TONE: Record<string, 'blue' | 'green' | 'neutral'> = {
  aberta: 'blue',
  encerrada: 'green',
  cancelada: 'neutral',
}

export default async function AdminPreVendasPage() {
  const supabase = await createClient()
  const [{ data: campaigns }, { data: rewards }] = await Promise.all([
    supabase
      .from('preorder_campaigns')
      .select('id, name, slug, status, expected_date, signups:preorder_signups(count)')
      .order('created_at', { ascending: false }),
    supabase.from('rewards').select('id, name').order('name'),
  ])

  type CampaignRow = {
    id: string
    name: string
    slug: string
    status: string
    expected_date: string | null
    signups: { count: number }[]
  }
  const rows = (campaigns ?? []) as unknown as CampaignRow[]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-lg font-semibold text-neutral-900">Pré-vendas</h1>
        <Table>
          <Thead>
            <Th>Produto</Th>
            <Th>Inscritos</Th>
            <Th>Status</Th>
            <Th />
          </Thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyState message="Nenhuma pré-venda cadastrada." />
            ) : (
              rows.map((campaign) => (
                <Tr key={campaign.id}>
                  <Td className="font-medium text-neutral-900">{campaign.name}</Td>
                  <Td>{campaign.signups?.[0]?.count ?? 0}</Td>
                  <Td>
                    <Badge tone={STATUS_TONE[campaign.status]}>{campaign.status}</Badge>
                  </Td>
                  <Td>
                    <Link href={`/admin/pre-vendas/${campaign.id}`} className="text-sm text-neutral-600 hover:underline">
                      Gerenciar
                    </Link>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <Card className="h-fit">
        <h2 className="text-sm font-semibold text-neutral-900">Nova pré-venda</h2>
        <p className="mb-4 mt-1 text-xs text-neutral-500">
          As imagens são adicionadas depois de salvar, na tela de gerenciamento da pré-venda.
        </p>
        <PreorderCampaignForm action={createPreorderCampaign} rewards={rewards ?? []} submitLabel="Criar pré-venda" />
      </Card>
    </div>
  )
}
