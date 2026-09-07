import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { HomeBannerForm } from '../HomeBannerForm'
import { updateHomeBanner } from '../actions'
import { BannerImageManager } from './BannerImageManager'
import { ImageSourceSelector } from './ImageSourceSelector'
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
        <ImageSourceSelector
          bannerId={banner.id}
          preorderCampaigns={preorderCampaigns ?? []}
          currentCampaignId={linkedCampaign?.id ?? null}
        />
        {linkedCampaign ? (
          <p className="text-sm text-neutral-500">
            Usando a imagem cadastrada na pré-venda <span className="font-medium text-neutral-700">{linkedCampaign.name}</span>.{' '}
            <Link href={`/admin/pre-vendas/${linkedCampaign.id}`} className="text-neutral-900 underline">
              Trocar essa imagem
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
          defaultValues={banner}
          submitLabel="Salvar alterações"
        />
      </Card>
    </div>
  )
}
