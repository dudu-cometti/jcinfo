import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/data/settings'
import { verifyCustomerSession } from '@/lib/auth/customer-dal'
import { ProductVariantSection } from '@/components/public/ProductVariantSection'
import { ProductCard, type ProductCardData } from '@/components/public/ProductCard'

async function getProduct(slug: string) {
  const supabase = await createClient()
  const { data: product } = await supabase
    .from('products')
    .select(
      'id, name, slug, description, model, sku, price, promo_price, stock, min_stock, status, condition, category_id, brand_id, category:categories(name, slug), brand:brands(name, slug), images:product_images(url, position, variant_id), variants:product_variants(id, color_name, color_hex, price, promo_price, stock, status, position, images:product_images(url, position))',
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

  const images = (product.images as unknown as { url: string; position: number; variant_id: string | null }[]).filter(
    (i) => !i.variant_id,
  )
  const image = images.slice().sort((a, b) => a.position - b.position)[0]?.url

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
  const [product, settings, customerSession] = await Promise.all([
    getProduct(slug),
    getSiteSettings(),
    verifyCustomerSession(),
  ])
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

  type RawVariant = {
    id: string
    color_name: string
    color_hex: string | null
    price: number
    promo_price: number | null
    stock: number
    status: string
    position: number
    images: { url: string; position: number }[]
  }
  const variants = ((product.variants ?? []) as unknown as RawVariant[])
    .filter((v) => v.status === 'ativo')
    .sort((a, b) => a.position - b.position)
    .map((v) => ({
      id: v.id,
      color_name: v.color_name,
      color_hex: v.color_hex,
      price: v.price,
      promo_price: v.promo_price,
      stock: v.stock,
      images: [...v.images].sort((a, b) => a.position - b.position),
    }))

  const baseImages = (product.images as unknown as { url: string; position: number; variant_id: string | null }[])
    .filter((i) => !i.variant_id)
    .slice()
    .sort((a, b) => a.position - b.position)

  const category = product.category as unknown as { name: string; slug: string } | null
  const brand = product.brand as unknown as { name: string; slug: string } | null

  type RawRelated = ProductCardData & { images: { url: string; position: number }[] }
  const relatedProducts = (relatedRaw as unknown as RawRelated[]).map((p) => ({
    ...p,
    image_url: [...p.images].sort((a, b) => a.position - b.position)[0]?.url ?? null,
  }))

  const specs = [
    brand && { label: 'Marca', value: brand.name },
    product.model && { label: 'Modelo', value: product.model },
    category && { label: 'Categoria', value: category.name },
    product.condition === 'novo' && { label: 'Condição', value: 'Novo' },
    product.condition === 'seminovo' && { label: 'Condição', value: 'Seminovo' },
    product.sku && { label: 'SKU', value: product.sku },
  ].filter(Boolean) as { label: string; value: string }[]

  const jsonLdImages = variants.length > 0 ? variants.flatMap((v) => v.images.map((i) => i.url)) : baseImages.map((i) => i.url)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    brand: brand ? { '@type': 'Brand', name: brand.name } : undefined,
    image: jsonLdImages,
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

      <ProductVariantSection
        product={{
          id: product.id,
          name: product.name,
          description: product.description,
          model: product.model,
          min_stock: product.min_stock,
        }}
        brand={brand}
        category={category}
        basePrice={product.price}
        basePromoPrice={product.promo_price}
        baseStock={product.stock}
        baseImages={baseImages}
        variants={variants}
        whatsappNumber={settings.whatsapp_number}
        specs={specs}
        activeCampaigns={activeCampaigns}
        knownCustomer={customerSession ? { name: customerSession.name, phone: customerSession.phone } : null}
      />

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
    </div>
  )
}
