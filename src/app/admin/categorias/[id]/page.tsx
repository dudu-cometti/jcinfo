import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { CategoryForm } from '../CategoryForm'
import { updateCategory } from '../actions'

export const metadata = { title: 'Editar categoria' }

export default async function EditCategoryPage({
  params,
}: PageProps<'/admin/categorias/[id]'>) {
  const { id } = await params
  const supabase = await createClient()
  const { data: category } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('id', id)
    .single()

  if (!category) notFound()

  return (
    <Card className="max-w-lg">
      <h1 className="mb-4 text-lg font-semibold text-neutral-900">Editar categoria</h1>
      <CategoryForm
        action={updateCategory.bind(null, category.id)}
        defaultValues={{ name: category.name, slug: category.slug }}
        submitLabel="Salvar alterações"
      />
    </Card>
  )
}
