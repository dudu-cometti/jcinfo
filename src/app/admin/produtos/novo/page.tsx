import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { ProductForm } from '../ProductForm'
import { createProduct } from '../actions'

export const metadata = { title: 'Novo produto' }

export default async function NewProductPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase.from('categories').select('id, name').order('name')

  return (
    <Card className="max-w-3xl">
      <h1 className="mb-6 text-lg font-semibold text-neutral-900">Novo produto</h1>
      <ProductForm action={createProduct} categories={categories ?? []} submitLabel="Criar produto" />
    </Card>
  )
}
