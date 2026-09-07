import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { HomeBannerForm } from '../HomeBannerForm'
import { updateHomeBanner } from '../actions'

export const metadata = { title: 'Editar destaque' }

export default async function EditHomeBannerPage({ params }: PageProps<'/admin/destaques/[id]'>) {
  const { id } = await params
  const supabase = await createClient()
  const { data: banner } = await supabase.from('home_banners').select('*').eq('id', id).single()

  if (!banner) notFound()

  return (
    <Card className="max-w-lg">
      <h1 className="mb-4 text-lg font-semibold text-neutral-900">Editar destaque</h1>
      <HomeBannerForm
        action={updateHomeBanner.bind(null, banner.id)}
        defaultValues={banner}
        submitLabel="Salvar alterações"
      />
    </Card>
  )
}
