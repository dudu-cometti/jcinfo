import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { HomeBannerForm } from '../HomeBannerForm'
import { updateHomeBanner } from '../actions'
import { BannerImageManager } from './BannerImageManager'
import { ImageSourceSelector } from './ImageSourceSelector'
import { getHomeBannerLinkOptions } from '@/lib/data/link-options'
import type { HomeBannerImageSource } from '../actions'

export const metadata = { title: 'Editar destaque' }

export default async function EditHomeBannerPage({ params }: PageProps<'/admin/destaques/[id]'>) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: banner }, linkOptions, { data: preorderCampaigns }, { data: raffles }] = await Promise.all([
    supabase
      .from('home_banners')
      .select('*, preorder_campaign:preorder_campaigns(id, name), raffle:raffles(id, name)')
      .eq('id', id)
      .single(),
    getHomeBannerLinkOptions(),
    supabase.from('preorder_campaigns').select('id, name, status').order('created_at', { ascending: false }),
    supabase.from('raffles').select('id, name, status').order('created_at', { ascending: false }),
  ])

  if (!banner) notFound()

  type LinkedEntity = { id: string; name: string } | null
  const linkedCampaign = banner.preorder_campaign as unknown as LinkedEntity
  const linkedRaffle = banner.raffle as unknown as LinkedEntity

  const currentSource: HomeBannerImageSource = linkedCampaign
    ? { type: 'preorder', id: linkedCampaign.id }
    : linkedRaffle
      ? { type: 'raffle', id: linkedRaffle.id }
      : null

  return (
    <div className="max-w-lg space-y-6">
      <Card>
        <h1 className="mb-4 text-lg font-semibold text-neutral-900">Imagens</h1>
        <ImageSourceSelector
          bannerId={banner.id}
          preorderCampaigns={preorderCampaigns ?? []}
          raffles={raffles ?? []}
          currentSource={currentSource}
        />
        {linkedCampaign ? (
          <p className="text-sm text-neutral-500">
            Usando a imagem cadastrada na pré-venda <span className="font-medium text-neutral-700">{linkedCampaign.name}</span>.{' '}
            <Link href={`/admin/pre-vendas/${linkedCampaign.id}`} className="text-neutral-900 underline">
              Trocar essa imagem
            </Link>
          </p>
        ) : linkedRaffle ? (
          <p className="text-sm text-neutral-500">
            Usando a imagem cadastrada no sorteio <span className="font-medium text-neutral-700">{linkedRaffle.name}</span>.{' '}
            <Link href={`/admin/sorteios/${linkedRaffle.id}`} className="text-neutral-900 underline">
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
