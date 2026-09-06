import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { Input, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ProductCard, type ProductCardData } from '@/components/public/ProductCard'

export const metadata: Metadata = {
  title: 'Produtos',
  description: 'Celulares, notebooks, drones e acessórios com os melhores preços.',
}

const PAGE_SIZE = 24

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function ProdutosPage({ searchParams }: PageProps<'/produtos'>) {
  const params = await searchParams
  const q = firstParam(params.q) ?? ''
  const categoryId = firstParam(params.categoria) ?? ''
  const brandId = firstParam(params.marca) ?? ''
  const page = Number(firstParam(params.page) ?? '1') || 1

  const supabase = await createClient()
  const [{ data: categories }, { data: brands }, productsResult] = await Promise.all([
    supabase.from('categories').select('id, name').order('name'),
    supabase.from('brands').select('id, name').order('name'),
    (async () => {
      let query = supabase
        .from('products')
        .select('id, name, slug, price, promo_price, stock, images:product_images(url, position)', {
          count: 'exact',
        })
        .eq('status', 'ativo')
        .order('created_at', { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      if (q) query = query.ilike('name', `%${q}%`)
      if (categoryId) query = query.eq('category_id', categoryId)
      if (brandId) query = query.eq('brand_id', brandId)

      return query
    })(),
  ])

  type RawProduct = ProductCardData & { images: { url: string; position: number }[] }
  const products = ((productsResult.data ?? []) as unknown as RawProduct[]).map((p) => ({
    ...p,
    image_url: [...p.images].sort((a, b) => a.position - b.position)[0]?.url ?? null,
  }))
  const totalPages = Math.max(1, Math.ceil((productsResult.count ?? 0) / PAGE_SIZE))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-neutral-900">Produtos</h1>

      <form className="flex flex-wrap gap-3">
        <Input name="q" defaultValue={q} placeholder="Buscar produtos..." className="max-w-sm" />
        <Select name="categoria" defaultValue={categoryId} className="max-w-[220px]">
          <option value="">Todas as categorias</option>
          {(categories ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select name="marca" defaultValue={brandId} className="max-w-[220px]">
          <option value="">Todas as marcas</option>
          {(brands ?? []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      {products.length === 0 ? (
        <p className="text-neutral-500">Nenhum produto encontrado.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/produtos?${new URLSearchParams({ q, categoria: categoryId, marca: brandId, page: String(p) }).toString()}`}
              className={`rounded-md px-3 py-1 ${p === page ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
