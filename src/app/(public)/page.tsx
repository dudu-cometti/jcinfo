import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCard, type ProductCardData } from '@/components/public/ProductCard'
import { Badge } from '@/components/ui/badge'

export default async function HomePage() {
  const supabase = await createClient()

  const [{ data: featuredProducts }, { data: categories }, { data: campaigns }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, price, promo_price, stock, images:product_images(url, position)')
      .eq('status', 'ativo')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('categories').select('id, name, slug').order('name').limit(12),
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

  return (
    <div className="space-y-16">
      <section className="rounded-3xl bg-gradient-to-br from-brand-teal to-brand-navy px-8 py-16 text-center text-white">
        <h1 className="text-3xl font-semibold sm:text-4xl">Celulares, notebooks e eletrônicos</h1>
        <p className="mx-auto mt-3 max-w-xl text-white/80">
          Compre pelo WhatsApp e acumule pontos a cada compra confirmada.
        </p>
        <Link
          href="/produtos"
          className="mt-6 inline-block rounded-lg bg-brand-cyan px-6 py-3 text-sm font-semibold text-brand-navy hover:brightness-95"
        >
          Ver produtos
        </Link>
      </section>

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
          <div className="mb-4 flex items-center justify-between">
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
    </div>
  )
}
