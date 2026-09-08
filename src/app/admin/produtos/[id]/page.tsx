import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductForm } from '../ProductForm'
import { updateProduct, setProductStatus } from '../actions'
import { ImageManager } from './ImageManager'
import { VariantManager, type Variant } from './VariantManager'

export const metadata = { title: 'Editar produto' }

export default async function EditProductPage({ params }: PageProps<'/admin/produtos/[id]'>) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: product }, { data: categories }, { data: brands }, { data: images }, { data: variants }] =
    await Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase.from('categories').select('id, name').order('name'),
      supabase.from('brands').select('id, name').order('name'),
      supabase.from('product_images').select('id, url').eq('product_id', id).is('variant_id', null).order('position'),
      supabase
        .from('product_variants')
        .select('id, color_name, color_hex, price, promo_price, stock, sku, status, images:product_images(id, url, position)')
        .eq('product_id', id)
        .order('position'),
    ])

  if (!product) notFound()

  type RawVariant = Omit<Variant, 'images'> & { images: { id: string; url: string; position: number }[] }
  const variantRows: Variant[] = ((variants ?? []) as unknown as RawVariant[]).map((v) => ({
    ...v,
    images: [...v.images].sort((a, b) => a.position - b.position),
  }))

  const toggleStatus = async () => {
    'use server'
    await setProductStatus(id, product.status === 'ativo' ? 'inativo' : 'ativo')
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-neutral-900">Editar produto</h1>
          <Badge tone={product.status === 'ativo' ? 'green' : 'neutral'}>
            {product.status === 'ativo' ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>
        <form action={toggleStatus}>
          <button type="submit" className="text-sm text-neutral-600 hover:underline">
            {product.status === 'ativo' ? 'Desativar produto' : 'Reativar produto'}
          </button>
        </form>
      </div>

      {product.condition === 'novo' && (
        <Card id="cores" className="scroll-mt-4">
          <h2 className="mb-1 text-sm font-semibold text-neutral-900">Cores</h2>
          <p className="mb-4 text-xs text-neutral-500">
            Cada cor tem seu próprio preço, estoque e fotos. Ao vender, o vendedor escolhe qual cor saiu.
          </p>
          <VariantManager productId={id} variants={variantRows} />
        </Card>
      )}

      <Card id="imagens" className="scroll-mt-4">
        <h2 className="mb-1 text-sm font-semibold text-neutral-900">
          {variantRows.length > 0 ? 'Imagens gerais' : 'Imagens'}
        </h2>
        {variantRows.length > 0 && (
          <p className="mb-4 text-xs text-neutral-500">
            Fotos que não são de uma cor específica (ex: foto da caixa, acessórios).
          </p>
        )}
        <ImageManager productId={id} images={images ?? []} />
      </Card>

      <Card>
        <ProductForm
          action={updateProduct.bind(null, id)}
          categories={categories ?? []}
          brands={brands ?? []}
          hasVariants={variantRows.length > 0}
          defaultValues={{
            name: product.name,
            slug: product.slug,
            description: product.description,
            category_id: product.category_id,
            brand_id: product.brand_id,
            model: product.model,
            price: product.price,
            promo_price: product.promo_price,
            cost: product.cost,
            stock: product.stock,
            min_stock: product.min_stock,
            sku: product.sku,
            internal_code: product.internal_code,
            status: product.status,
            featured: product.featured,
            condition: product.condition,
          }}
          submitLabel="Salvar alterações"
        />
      </Card>
    </div>
  )
}
