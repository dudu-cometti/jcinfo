import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { HomeBannerForm } from '../HomeBannerForm'
import { updateHomeBanner } from '../actions'
import { BannerImageManager } from './BannerImageManager'
import { getHomeBannerLinkOptions } from '@/lib/data/link-options'

export const metadata = { title: 'Editar destaque' }

export default async function EditHomeBannerPage({ params }: PageProps<'/admin/destaques/[id]'>) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: banner }, linkOptions, { data: preorderCampaigns }] = await Promise.all([
    supabase
      .from('home_banners')
      .select('*, preorder_campaign:preorder_campaigns(id, name)')
      .eq('id', id)
      .single(),
    getHomeBannerLinkOptions(),
    supabase.from('preorder_campaigns').select('id, name, status').order('created_at', { ascending: false }),
  ])

  if (!banner) notFound()

  type LinkedCampaign = { id: string; name: string } | null
  const linkedCampaign = banner.preorder_campaign as unknown as LinkedCampaign

  return (
    <div className="max-w-lg space-y-6">
      <Card>
        <h1 className="mb-4 text-lg font-semibold text-neutral-900">Imagens</h1>
        {linkedCampaign ? (
          <p className="text-sm text-neutral-500">
            Este destaque está vinculado à pré-venda <span className="font-medium text-neutral-700">{linkedCampaign.name}</span>,
            a imagem é a mesma cadastrada lá.{' '}
            <Link href={`/admin/pre-vendas/${linkedCampaign.id}`} className="text-neutral-900 underline">
              Editar imagem da pré-venda
            </Link>
          </p>
        ) : (
          <BannerImageManager bannerId={banner.id} imageUrl={banner.image_url} imageUrlMobile={banner.image_url_mobile} />
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Editar destaque</h2>
        <HomeBannerForm
          action={updateHomeBanner.bind(null, banner.id)}
          linkOptions={linkOptions}
          preorderCampaigns={preorderCampaigns ?? []}
          defaultValues={banner}
          submitLabel="Salvar alterações"
        />
      </Card>
    </div>
  )
}
