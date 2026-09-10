import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard, type ProductCardData } from '@/components/public/ProductCard'
import { HeroCarousel } from '@/components/public/HeroCarousel'
import { Badge } from '@/components/ui/badge'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: banners }, { data: featuredProducts }, { data: categories }, { data: brands }, { data: campaigns }] =
    await Promise.all([
      supabase
        .from('home_banners')
        .select(
          'id, title, subtitle, cta_label, cta_href, image_url, image_url_mobile, show_text_overlay, preorder_campaign:preorder_campaigns(image_url, image_url_mobile), raffle:raffles(image_url)',
        )
        .eq('active', true)
        .order('position'),
      supabase
        .from('products_public_v')
        .select('id, name, slug, price, promo_price, stock, images:product_images(url, position)')
        .eq('status', 'ativo')
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(8),
      supabase.from('categories').select('id, name, slug').order('name').limit(12),
      supabase.from('brands').select('id, name, slug').order('name').limit(12),
      supabase
        .from('point_campaigns')
        .select('id, name, description, min_points')
        .eq('status', 'ativa')
        .eq('featured', true)
        .limit(3),
    ])

  type RawProduct = ProductCardData & { images: { url: string; position: number }[] }
  const products = ((featuredProducts ?? []) as unknown as RawProduct[]).map((p) => ({
    ...p,
    image_url: [...p.images].sort((a, b) => a.position - b.position)[0]?.url ?? null,
  }))

  type RawBanner = {
    id: string
    title: string
    subtitle: string | null
    cta_label: string | null
    cta_href: string | null
    image_url: string | null
    image_url_mobile: string | null
    show_text_overlay: boolean
    preorder_campaign: { image_url: string | null; image_url_mobile: string | null } | null
    raffle: { image_url: string | null } | null
  }
  const resolvedBanners = ((banners ?? []) as unknown as RawBanner[]).map((banner) => {
    const linkedImage = banner.preorder_campaign
      ? (banner.preorder_campaign.image_url_mobile ?? banner.preorder_campaign.image_url)
      : banner.raffle
        ? banner.raffle.image_url
        : null
    if (!linkedImage) return banner
    return {
      ...banner,
      image_url: linkedImage,
      image_url_mobile: linkedImage,
      imageFit: 'contain' as const,
    }
  })

  return (
    <div className="space-y-16">
      <HeroCarousel banners={resolvedBanners} />

      {campaigns && campaigns.length > 0 && (
        <section className="rounded-3xl bg-gradient-to-br from-brand-navy to-brand-teal px-6 py-8 sm:px-10 sm:py-10">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">Campanhas de pontos</h2>
            <p className="mt-1 text-sm text-white/60">Acumule pontos em cada compra e troque por prêmios</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-2xl bg-white/10 p-5 ring-1 ring-inset ring-white/15">
                <span className="text-xs font-semibold tracking-wide text-brand-cyan">
                  {campaign.min_points.toLocaleString('pt-BR')} pontos
                </span>
                <h3 className="mt-2 font-medium text-white">{campaign.name}</h3>
                <p className="mt-1 text-sm text-white/60">{campaign.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-neutral-900">Produtos em destaque</h2>
            <Link href="/produtos" className="text-sm text-brand-navy hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {categories && categories.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-semibold text-neutral-500">Categorias</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categoria/${category.slug}`}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 hover:border-brand-navy/40 hover:bg-brand-navy/5 hover:text-brand-navy"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {brands && brands.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-semibold text-neutral-500">Marcas</h2>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/marca/${brand.slug}`}
                className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 hover:border-brand-navy/40 hover:bg-brand-navy/5 hover:text-brand-navy"
              >
                {brand.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
