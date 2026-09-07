'use client'

import { useState } from 'react'
import Image from 'next/image'
import { uploadPreorderCampaignImage, removePreorderCampaignImage } from '../actions'

export function CampaignImageManager({
  campaignId,
  imageUrl,
  imageUrlMobile,
}: {
  campaignId: string
  imageUrl: string | null
  imageUrlMobile: string | null
}) {
  const currentUrl = imageUrlMobile ?? imageUrl
  const currentField = imageUrlMobile ? 'image_url_mobile' : 'image_url'
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPending(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.set('file', file)
      const result = await uploadPreorderCampaignImage(campaignId, 'image_url_mobile', formData)
      if (result?.error) setError(result.error)
    } catch {
      setError('Erro ao enviar imagem. Tente novamente.')
    } finally {
      setPending(false)
      e.target.value = ''
    }
  }

  return (
    <div>
      <p className="text-sm font-medium text-neutral-700">Imagem</p>
      <p className="mb-2 text-xs text-neutral-500">
        Formato quadrado, recomendado 1080x1080px. A mesma imagem é usada no computador e no celular.
      </p>

      {currentUrl ? (
        <div className="group relative aspect-square w-full overflow-hidden rounded-lg border border-neutral-200 sm:w-64">
          <Image src={currentUrl} alt="Imagem da pré-venda" fill className="object-cover" />
          <form action={() => removePreorderCampaignImage(campaignId, currentField)} className="absolute right-1 top-1">
            <button
              type="submit"
              className="rounded-full bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100"
            >
              Remover
            </button>
          </form>
        </div>
      ) : (
        <label className="flex aspect-square w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-neutral-300 text-sm text-neutral-500 hover:bg-neutral-50 sm:w-64">
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
