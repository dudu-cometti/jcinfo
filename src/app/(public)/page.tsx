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
          'id, title, subtitle, cta_label, cta_href, image_url, image_url_mobile, show_text_overlay, preorder_campaign:preorder_campaigns(image_url, image_url_mobile)',
        )
        .eq('active', true)
        .order('position'),
      supabase
        .from('products')
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
  }
  const resolvedBanners = ((banners ?? []) as unknown as RawBanner[]).map((banner) => {
    const linked = banner.preorder_campaign
    if (!linked) return banner
    const linkedImage = linked.image_url_mobile ?? linked.image_url
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
        <section>
          <h2 className="mb-4 text-xl font-semibold text-neutral-900">Campanhas de pontos ativas</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="rounded-2xl border border-neutral-200 bg-white p-5">
                <Badge className="bg-brand-cyan/15 text-brand-navy">
                  {campaign.min_points.toLocaleString('pt-BR')} pontos
                </Badge>
                <h3 className="mt-2 font-medium text-neutral-900">{campaign.name}</h3>
                <p className="mt-1 text-sm text-neutral-500">{campaign.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {products.length > 0 && (
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-neutral-900">Produtos em destaque</h2>
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
          <h2 className="mb-4 text-xl font-semibold text-neutral-900">Categorias</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categoria/${category.slug}`}
                className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-700 hover:border-brand-navy/30 hover:bg-brand-navy/5 hover:text-brand-navy"
              >
                {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {brands && brands.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-neutral-900">Marcas</h2>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/marca/${brand.slug}`}
                className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-700 hover:border-brand-navy/30 hover:bg-brand-navy/5 hover:text-brand-navy"
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
