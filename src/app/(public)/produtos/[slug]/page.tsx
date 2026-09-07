import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/data/settings'
import { Badge } from '@/components/ui/badge'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { ProductGallery } from '@/components/public/ProductGallery'
import { ShareProductButton } from '@/components/public/ShareProductButton'
import { ProductCard, type ProductCardData } from '@/components/public/ProductCard'
import { formatBRL } from '@/lib/utils'

async function getProduct(slug: string) {
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select(
      'id, name, slug, description, model, sku, price, promo_price, stock, min_stock, status, category_id, brand_id, category:categories(name, slug), brand:brands(name, slug), images:product_images(url, position)',
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
  const RELATED_SELECT = 'id, name, slug, price, promo_price, stock, images:product_images(url, position)'

  const [{ data: campaigns }, { data: sameCategory }] = await Promise.all([
    supabase
      .from('point_campaigns')
      .select('id, name, min_points, campaign_rewards(reward:rewards(name))')
      .eq('status', 'ativa'),
    product.category_id
      ? supabase
          .from('products')
          .select(RELATED_SELECT)
          .eq('status', 'ativo')
          .eq('category_id', product.category_id)
          .neq('id', product.id)
          .limit(4)
      : Promise.resolve({ data: [] as never[] }),
  ])

  // Small catalogs often only have one product per category — fall back to
  // "same brand" so this section still has something to show.
  let relatedRaw = sameCategory ?? []
  if (relatedRaw.length === 0 && product.brand_id) {
    const { data: sameBrand } = await supabase
      .from('products')
      .select(RELATED_SELECT)
      .eq('status', 'ativo')
      .eq('brand_id', product.brand_id)
      .neq('id', product.id)
      .limit(4)
    relatedRaw = sameBrand ?? []
  }

  type CampaignRow = { id: string; name: string; min_points: number; campaign_rewards: { reward: { name: string } | null }[] }
  const activeCampaigns = (campaigns ?? []) as unknown as CampaignRow[]

  const images = (product.images as unknown as { url: string; position: number }[])
    .slice()
    .sort((a, b) => a.position - b.position)
  const category = product.category as unknown as { name: string; slug: string } | null
  const brand = product.brand as unknown as { name: string; slug: string } | null
  const estimatedPoints = Math.floor(product.promo_price ?? product.price)
  const discountPercent = product.promo_price
    ? Math.round(((product.price - product.promo_price) / product.price) * 100)
    : null
  const outOfStock = product.stock === 0
  const lowStock = !outOfStock && product.stock <= product.min_stock

  type RawRelated = ProductCardData & { images: { url: string; position: number }[] }
  const relatedProducts = (relatedRaw as unknown as RawRelated[]).map((p) => ({
    ...p,
    image_url: [...p.images].sort((a, b) => a.position - b.position)[0]?.url ?? null,
  }))

  const specs = [
    brand && { label: 'Marca', value: brand.name },
    product.model && { label: 'Modelo', value: product.model },
    category && { label: 'Categoria', value: category.name },
    product.sku && { label: 'SKU', value: product.sku },
  ].filter(Boolean) as { label: string; value: string }[]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    brand: brand ? { '@type': 'Brand', name: brand.name } : undefined,
    image: images.map((i) => i.url),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'BRL',
      price: product.promo_price ?? product.price,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  }

  return (
    <div className="space-y-12 pb-24 lg:pb-0">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="text-sm text-neutral-500">
        <Link href="/" className="hover:underline">
          Início
        </Link>
        {' / '}
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={images} productName={product.name} discountPercent={discountPercent} outOfStock={outOfStock} />

        <div className="space-y-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                {category && <p className="text-sm text-neutral-500">{category.name}</p>}
                <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">{product.name}</h1>
              </div>
              <ShareProductButton />
            </div>
            {(brand || product.model) && (
              <p className="mt-1 text-sm text-neutral-500">
                {brand ? (
                  <Link href={`/marca/${brand.slug}`} className="hover:underline">
                    {brand.name}
                  </Link>
                ) : null}
                {brand && product.model ? ' · ' : null}
                {product.model}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
              {product.promo_price ? (
                <>
                  <span className="text-3xl font-semibold text-brand-navy sm:text-4xl">{formatBRL(product.promo_price)}</span>
                  <span className="text-base text-neutral-400 line-through">{formatBRL(product.price)}</span>
                  {discountPercent && <Badge tone="red">-{discountPercent}%</Badge>}
                </>
              ) : (
                <span className="text-3xl font-semibold text-neutral-900 sm:text-4xl">{formatBRL(product.price)}</span>
              )}
            </div>
            {product.promo_price && (
              <p className="text-sm text-green-700">Você economiza {formatBRL(product.price - product.promo_price)}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {outOfStock ? (
              <Badge tone="red">Fora de estoque</Badge>
            ) : lowStock ? (
              <Badge tone="yellow">Últimas unidades</Badge>
            ) : (
              <Badge tone="green">Em estoque</Badge>
            )}
          </div>

          {product.description && <p className="whitespace-pre-line text-neutral-600">{product.description}</p>}

          <div className="hidden lg:block">
            <WhatsAppButton
              whatsappNumber={settings.whatsapp_number}
              productId={product.id}
              productName={product.name}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 sm:w-auto sm:px-8"
            />
          </div>

          {specs.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h2 className="mb-2 text-sm font-semibold text-neutral-900">Ficha técnica</h2>
              <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-center justify-between gap-3 border-b border-neutral-100 py-1.5 last:border-0 sm:border-0 sm:py-1"
                  >
                    <dt className="text-sm text-neutral-500">{spec.label}</dt>
                    <dd className="text-sm font-medium text-neutral-800">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {activeCampaigns.length > 0 && (
            <div className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/10 p-4">
              <p className="text-sm font-medium text-brand-navy">
                Comprando este produto você acumula até <strong>{estimatedPoints.toLocaleString('pt-BR')} pontos</strong>.
              </p>
              <ul className="mt-2 space-y-1.5">
                {activeCampaigns.map((campaign) => {
                  const rewardNames = campaign.campaign_rewards
                    .map((cr) => cr.reward?.name)
                    .filter((name): name is string => Boolean(name))
                  const label =
                    rewardNames.length > 0
                      ? `A partir de ${campaign.min_points.toLocaleString('pt-BR')} pontos: ${rewardNames.join(', ')}`
                      : campaign.name
                  return (
                    <li key={campaign.id} className="flex items-start gap-2 text-sm text-brand-teal">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-teal" />
                      {label}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-neutral-900">Você também pode gostar</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard key={related.id} product={related} />
            ))}
          </div>
        </section>
      )}

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {product.promo_price ? (
              <p className="truncate text-lg font-semibold text-brand-navy">{formatBRL(product.promo_price)}</p>
            ) : (
              <p className="truncate text-lg font-semibold text-neutral-900">{formatBRL(product.price)}</p>
            )}
          </div>
          <WhatsAppButton
            whatsappNumber={settings.whatsapp_number}
            productId={product.id}
            productName={product.name}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          />
        </div>
      </div>
    </div>
  )
}
