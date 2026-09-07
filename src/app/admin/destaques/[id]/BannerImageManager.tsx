'use client'

import { useState } from 'react'
import Image from 'next/image'
import { uploadHomeBannerImage, removeHomeBannerImage } from '../actions'

type Field = 'image_url' | 'image_url_mobile'

function ImageSlot({
  bannerId,
  field,
  label,
  hint,
  currentUrl,
}: {
  bannerId: string
  field: Field
  label: string
  hint: string
  currentUrl: string | null
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPending(true)
    setError(null)

    const formData = new FormData()
    formData.set('file', file)
    const result = await uploadHomeBannerImage(bannerId, field, formData)
    if (result?.error) setError(result.error)
    setPending(false)
    e.target.value = ''
  }

  return (
    <div>
      <p className="text-sm font-medium text-neutral-700">{label}</p>
      <p className="mb-2 text-xs text-neutral-500">{hint}</p>

      {currentUrl ? (
        <div className="group relative aspect-video w-full overflow-hidden rounded-lg border border-neutral-200 sm:w-64">
          <Image src={currentUrl} alt={label} fill className="object-cover" />
          <form action={() => removeHomeBannerImage(bannerId, field)} className="absolute right-1 top-1">
            <button
              type="submit"
              className="rounded-full bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100"
            >
              Remover
            </button>
          </form>
        </div>
      ) : (
        <label className="flex aspect-video w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-neutral-300 text-sm text-neutral-500 hover:bg-neutral-50 sm:w-64">
          {pending ? 'Enviando...' : 'Selecionar imagem'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={pending}
            onChange={handleUpload}
          />
        </label>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export function BannerImageManager({
  bannerId,
  imageUrl,
  imageUrlMobile,
}: {
  bannerId: string
  imageUrl: string | null
  imageUrlMobile: string | null
}) {
  return (
    <div className="space-y-4">
      <ImageSlot
        bannerId={bannerId}
        field="image_url"
        label="Imagem para computador"
        hint="Formato paisagem, 1920x960px (proporção 2:1). Sem imagem, usa o degradê padrão da marca"
        currentUrl={imageUrl}
      />
      <ImageSlot
        bannerId={bannerId}
        field="image_url_mobile"
        label="Imagem para celular"
        hint="Formato quadrado, 1080x1080px. Sem imagem própria, usa a mesma imagem do computador, recortada"
        currentUrl={imageUrlMobile}
      />
    </div>
  )
}
