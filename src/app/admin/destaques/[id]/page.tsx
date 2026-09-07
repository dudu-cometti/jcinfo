import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { HomeBannerForm } from '../HomeBannerForm'
import { updateHomeBanner } from '../actions'
import { BannerImageManager } from './BannerImageManager'
import { getHomeBannerLinkOptions } from '@/lib/data/link-options'

export const metadata = { title: 'Editar destaque' }

export default async function EditHomeBannerPage({ params }: PageProps<'/admin/destaques/[id]'>) {
  const { id } = await params
  const supabase = await createClient()
  const [{ data: banner }, linkOptions] = await Promise.all([
    supabase.from('home_banners').select('*').eq('id', id).single(),
    getHomeBannerLinkOptions(),
  ])

  if (!banner) notFound()

  return (
    <div className="max-w-lg space-y-6">
      <Card>
        <h1 className="mb-4 text-lg font-semibold text-neutral-900">Imagens</h1>
        <BannerImageManager bannerId={banner.id} imageUrl={banner.image_url} imageUrlMobile={banner.image_url_mobile} />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Editar destaque</h2>
        <HomeBannerForm
          action={updateHomeBanner.bind(null, banner.id)}
          linkOptions={linkOptions}
          defaultValues={banner}
          submitLabel="Salvar alterações"
        />
      </Card>
    </div>
  )
}
