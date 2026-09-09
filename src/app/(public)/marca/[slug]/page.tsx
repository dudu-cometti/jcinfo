import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductCard, type ProductCardData } from '@/components/public/ProductCard'

export async function generateMetadata({ params }: PageProps<'/marca/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: brand } = await supabase.from('brands').select('name').eq('slug', slug).single()

  if (!brand) return {}
  return {
    title: brand.name,
    description: `Confira nossos produtos da marca ${brand.name}.`,
  }
}

export default async function BrandPage({ params }: PageProps<'/marca/[slug]'>) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: brand } = await supabase.from('brands').select('id, name').eq('slug', slug).single()
  if (!brand) notFound()

  const { data: rawProducts } = await supabase
    .from('products_public_v')
    .select('id, name, slug, price, promo_price, stock, images:product_images(url, position)')
    .eq('status', 'ativo')
    .eq('brand_id', brand.id)
    .order('created_at', { ascending: false })

  type RawProduct = ProductCardData & { images: { url: string; position: number }[] }
  const products = ((rawProducts ?? []) as unknown as RawProduct[]).map((p) => ({
    ...p,
    image_url: [...p.images].sort((a, b) => a.position - b.position)[0]?.url ?? null,
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">{brand.name}</h1>
      {products.length === 0 ? (
        <p className="text-neutral-500">Nenhum produto desta marca no momento.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
