import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { HomeBannerForm } from './HomeBannerForm'
import { BannerRowActions } from './BannerRowActions'
import { createHomeBanner } from './actions'
import { getHomeBannerLinkOptions } from '@/lib/data/link-options'

export const metadata = { title: 'Destaques da home' }

export default async function AdminDestaquesPage() {
  const supabase = await createClient()
  const [{ data: banners }, linkOptions, { data: preorderCampaigns }] = await Promise.all([
    supabase
      .from('home_banners')
      .select('*, preorder_campaign:preorder_campaigns(name, slug)')
      .order('position'),
    getHomeBannerLinkOptions(),
    supabase.from('preorder_campaigns').select('id, name, status').order('created_at', { ascending: false }),
  ])

  type BannerRow = {
    id: string
    title: string
    cta_href: string | null
    active: boolean
    preorder_campaign: { name: string; slug: string } | null
  }
  const rows = (banners ?? []) as unknown as BannerRow[]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-2 text-lg font-semibold text-neutral-900">Destaques da home</h1>
        <p className="mb-4 text-sm text-neutral-500">
          O carrossel principal da página inicial. Ative quantos quiser, a ordem aqui é a ordem que aparece.
        </p>
        <Table>
          <Thead>
            <Th>Título</Th>
            <Th>Link</Th>
            <Th>Status</Th>
            <Th />
          </Thead>
          <tbody>
            {rows.length === 0 ? (
              <EmptyState message="Nenhum destaque cadastrado." />
            ) : (
              rows.map((banner, index) => (
                <Tr key={banner.id}>
                  <Td>
                    <Link href={`/admin/destaques/${banner.id}`} className="font-medium text-neutral-900 hover:underline">
                      {banner.title}
                    </Link>
                    {banner.preorder_campaign && (
                      <div className="text-xs text-neutral-400">Vinculado a: {banner.preorder_campaign.name}</div>
                    )}
                  </Td>
                  <Td className="text-xs text-neutral-500">
                    {banner.preorder_campaign ? `/pre-venda/${banner.preorder_campaign.slug}` : (banner.cta_href ?? '-')}
                  </Td>
                  <Td>
                    <Badge tone={banner.active ? 'green' : 'neutral'}>{banner.active ? 'Ativo' : 'Inativo'}</Badge>
                  </Td>
                  <Td>
                    <BannerRowActions
                      bannerId={banner.id}
                      active={banner.active}
                      isFirst={index === 0}
                      isLast={index === rows.length - 1}
                    />
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <Card className="h-fit">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Novo destaque</h2>
        <HomeBannerForm
          action={createHomeBanner}
          linkOptions={linkOptions}
          preorderCampaigns={preorderCampaigns ?? []}
          submitLabel="Criar destaque"
        />
      </Card>
    </div>
  )
}
