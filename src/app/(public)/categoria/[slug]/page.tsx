import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProductCard, type ProductCardData } from '@/components/public/ProductCard'

export async function generateMetadata({ params }: PageProps<'/categoria/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data: category } = await supabase.from('categories').select('name').eq('slug', slug).single()

  if (!category) return {}
  return {
    title: category.name,
    description: `Confira nossos produtos de ${category.name}.`,
  }
}

export default async function CategoryPage({ params }: PageProps<'/categoria/[slug]'>) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase.from('categories').select('id, name').eq('slug', slug).single()
  if (!category) notFound()

  const { data: rawProducts } = await supabase
    .from('products')
    .select('id, name, slug, price, promo_price, stock, images:product_images(url, position)')
    .eq('status', 'ativo')
    .eq('category_id', category.id)
    .order('created_at', { ascending: false })

  type RawProduct = ProductCardData & { images: { url: string; position: number }[] }
  const products = ((rawProducts ?? []) as unknown as RawProduct[]).map((p) => ({
    ...p,
    image_url: [...p.images].sort((a, b) => a.position - b.position)[0]?.url ?? null,
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">{category.name}</h1>
      {products.length === 0 ? (
        <p className="text-neutral-500">Nenhum produto nesta categoria no momento.</p>
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
