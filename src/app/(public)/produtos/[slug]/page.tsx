import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/data/settings'
import { Badge } from '@/components/ui/badge'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { formatBRL } from '@/lib/utils'

async function getProduct(slug: string) {
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select(
      'id, name, slug, description, brand, model, price, promo_price, stock, status, category:categories(name, slug), images:product_images(url, position)',
    )
    .eq('slug', slug)
    .eq('status', 'ativo')
    .single()

  return product
}

export async function generateMetadata({ params }: PageProps<'/produtos/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return {}

  const image = (product.images as unknown as { url: string; position: number }[])
    .slice()
    .sort((a, b) => a.position - b.position)[0]?.url

  return {
    title: product.name,
    description: product.description ?? `${product.name} - confira preço, estoque e fotos.`,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: image ? [{ url: image }] : undefined,
      type: 'website',
    },
  }
}

export default async function ProductPage({ params }: PageProps<'/produtos/[slug]'>) {
  const { slug } = await params
  const [product, settings] = await Promise.all([getProduct(slug), getSiteSettings()])
  if (!product) notFound()

  const supabase = await createClient()
  const { data: campaigns } = await supabase
    .from('point_campaigns')
    .select('id, name, min_points, campaign_rewards(reward:rewards(name))')
    .eq('status', 'ativa')

  type CampaignRow = { id: string; name: string; min_points: number; campaign_rewards: { reward: { name: string } | null }[] }
  const activeCampaigns = (campaigns ?? []) as unknown as CampaignRow[]

  const images = (product.images as unknown as { url: string; position: number }[])
    .slice()
    .sort((a, b) => a.position - b.position)
  const category = product.category as unknown as { name: string; slug: string } | null
  const estimatedPoints = Math.floor(product.promo_price ?? product.price)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    brand: product.brand ?? undefined,
    image: images.map((i) => i.url),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: product.promo_price ?? product.price,
      availability:
        product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }

  return (
    <div className="space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-sm text-neutral-500">
        <Link href="/produtos" className="hover:underline">
          Produtos
        </Link>
        {category && (
          <>
            {' / '}
            <Link href={`/categoria/${category.slug}`} className="hover:underline">
              {category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
            {images[0] ? (
              <Image src={images[0].url} alt={product.name} fill sizes="50vw" className="object-cover" priority />
            ) : (
              <div className="flex h-full items-center justify-center text-neutral-400">Sem imagem</div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(1).map((image) => (
                <div key={image.url} className="relative aspect-square overflow-hidden rounded-lg bg-neutral-100">
                  <Image src={image.url} alt={product.name} fill sizes="120px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            {category && <p className="text-sm text-neutral-500">{category.name}</p>}
            <h1 className="text-2xl font-semibold text-neutral-900">{product.name}</h1>
            {(product.brand || product.model) && (
              <p className="text-sm text-neutral-500">
                {[product.brand, product.model].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          <div>
            {product.promo_price ? (
              <div>
                <p className="text-sm text-neutral-400 line-through">De {formatBRL(product.price)}</p>
                <p className="text-3xl font-semibold text-brand-navy">Por {formatBRL(product.promo_price)}</p>
              </div>
            ) : (
              <p className="text-3xl font-semibold text-neutral-900">{formatBRL(product.price)}</p>
            )}
          </div>

          <div>
            {product.stock > 0 ? (
              <Badge tone="green">Em estoque</Badge>
            ) : (
              <Badge tone="red">Fora de estoque</Badge>
            )}
          </div>

          {product.description && <p className="text-neutral-600">{product.description}</p>}

          <WhatsAppButton
            whatsappNumber={settings.whatsapp_number}
            productId={product.id}
            productName={product.name}
          />

          {activeCampaigns.length > 0 && (
            <div className="space-y-2 rounded-xl border border-brand-cyan/20 bg-brand-cyan/10 p-4">
              <p className="text-sm font-medium text-brand-navy">
                Compre este produto e acumule pontos! Esta compra pode gerar até{' '}
                <strong>{estimatedPoints.toLocaleString('pt-BR')}</strong> pontos.
              </p>
              {activeCampaigns.map((campaign) => {
                const rewardNames = campaign.campaign_rewards.map((cr) => cr.reward?.name).filter(Boolean)
                return (
                  <p key={campaign.id} className="text-sm text-brand-teal">
                    Junte {campaign.min_points.toLocaleString('pt-BR')} pontos e concorra a:{' '}
                    {rewardNames.join(', ') || campaign.name}
                  </p>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
