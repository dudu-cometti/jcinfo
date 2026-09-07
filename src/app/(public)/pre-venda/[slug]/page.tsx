import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { formatBRL, formatDate } from '@/lib/utils'
import { PreorderSignupForm } from './PreorderSignupForm'

async function getCampaign(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('preorder_campaigns')
    .select(
      'id, name, description, image_url, image_url_mobile, expected_price, expected_date, discount_percentage, status, reward:rewards(name)',
    )
    .eq('slug', slug)
    .single()
  return data
}

export async function generateMetadata({ params }: PageProps<'/pre-venda/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const campaign = await getCampaign(slug)
  if (!campaign) return {}

  return {
    title: `Pré-venda: ${campaign.name}`,
    description: campaign.description ?? `Garanta o seu ${campaign.name} antes de todo mundo.`,
    openGraph: {
      title: `Pré-venda: ${campaign.name}`,
      description: campaign.description ?? undefined,
      images: campaign.image_url_mobile ?? campaign.image_url ? [{ url: campaign.image_url_mobile ?? campaign.image_url! }] : undefined,
    },
  }
}

export default async function PreorderPage({ params }: PageProps<'/pre-venda/[slug]'>) {
  const { slug } = await params
  const campaign = await getCampaign(slug)
  if (!campaign) notFound()

  type Reward = { name: string } | null
  const reward = campaign.reward as unknown as Reward
  const isOpen = campaign.status === 'aberta'

  const benefitLine = reward
    ? `Quem entrar na lista garante: ${reward.name}`
    : campaign.discount_percentage
      ? `Quem entrar na lista garante ${campaign.discount_percentage}% de desconto`
      : null

  // A imagem quadrada funciona bem tanto no painel do celular (empilhado,
  // largura cheia) quanto no do computador (coluna alta e estreita): uma
  // imagem paisagem cortava o conteúdo dos lados nesse segundo caso.
  const image = campaign.image_url_mobile ?? campaign.image_url

  return (
    <div className="-mx-4 -my-8 overflow-hidden rounded-none bg-neutral-950 text-white sm:-mx-8 sm:mx-0 sm:my-0 sm:rounded-3xl">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col justify-center gap-6 px-6 py-16 sm:px-12 lg:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-cyan">Pré-venda</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">{campaign.name}</h1>
          </div>

          {campaign.description && <p className="max-w-md text-neutral-300">{campaign.description}</p>}

          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-neutral-400">
            {campaign.expected_price && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-neutral-500">A partir de</dt>
                <dd className="text-lg font-medium text-white">{formatBRL(campaign.expected_price)}</dd>
              </div>
            )}
            {campaign.expected_date && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-neutral-500">Chegada prevista</dt>
                <dd className="text-lg font-medium text-white">{formatDate(campaign.expected_date)}</dd>
              </div>
            )}
          </dl>

          {benefitLine && (
            <p className="rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-3 text-sm font-medium text-white">
              {benefitLine}
            </p>
          )}

          <div className="max-w-md pt-2">
            {isOpen ? (
              <PreorderSignupForm campaignId={campaign.id} dark />
            ) : (
              <p className="text-sm text-neutral-400">
                As inscrições para esta pré-venda foram encerradas.
              </p>
            )}
          </div>
        </div>

        <div className="relative min-h-[320px] bg-neutral-900 lg:min-h-full">
          {image ? (
            <Image
              src={image}
              alt={campaign.name}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full min-h-[320px] items-center justify-center">
              <span className="text-8xl font-semibold text-white/10">{campaign.name.slice(0, 2).toUpperCase()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
