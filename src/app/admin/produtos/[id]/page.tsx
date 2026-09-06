import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductForm } from '../ProductForm'
import { updateProduct, setProductStatus } from '../actions'
import { ImageManager } from './ImageManager'

export const metadata = { title: 'Editar produto' }

export default async function EditProductPage({ params }: PageProps<'/admin/produtos/[id]'>) {
  const { id } = await params
  const supabase = await createClient()
  // The regular (anon-key) client can no longer read `cost` at all — see
  // migration 000016 — so this specific read goes through the service-role
  // client, which bypasses column grants. This page is already fully
  // gated by requireRole('admin') at the layout level.
  const admin = createAdminClient()

  const [{ data: product }, { data: categories }, { data: brands }, { data: images }] = await Promise.all([
    admin.from('products').select('*').eq('id', id).single(),
    supabase.from('categories').select('id, name').order('name'),
    supabase.from('brands').select('id, name').order('name'),
    supabase.from('product_images').select('id, url').eq('product_id', id).order('position'),
  ])

  if (!product) notFound()

  const toggleStatus = async () => {
    'use server'
    await setProductStatus(id, product.status === 'ativo' ? 'inativo' : 'ativo')
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
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

      <Card>
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Imagens</h2>
        <ImageManager productId={id} images={images ?? []} />
      </Card>

      <Card>
        <ProductForm
          action={updateProduct.bind(null, id)}
          categories={categories ?? []}
          brands={brands ?? []}
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
          }}
          submitLabel="Salvar alterações"
        />
      </Card>
    </div>
  )
}
