import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { BrandForm } from '../BrandForm'
import { updateBrand } from '../actions'

export const metadata = { title: 'Editar marca' }

export default async function EditBrandPage({ params }: PageProps<'/admin/marcas/[id]'>) {
  const { id } = await params
  const supabase = await createClient()
  const { data: brand } = await supabase.from('brands').select('id, name, slug').eq('id', id).single()

  if (!brand) notFound()

  return (
    <Card className="max-w-lg">
      <h1 className="mb-4 text-lg font-semibold text-neutral-900">Editar marca</h1>
      <BrandForm
        action={updateBrand.bind(null, brand.id)}
        defaultValues={{ name: brand.name, slug: brand.slug }}
        submitLabel="Salvar alterações"
      />
    </Card>
  )
}
