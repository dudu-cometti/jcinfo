'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ImageCropModal } from '@/components/ui/image-crop-modal'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons'
import { uploadProductImage, replaceProductImage, deleteProductImage, moveProductImage } from '../actions'

type ProductImage = { id: string; url: string }

type CropTarget = { kind: 'new'; previewUrl: string; file: File } | { kind: 'existing'; imageId: string; url: string }

function blobToFile(blob: Blob, filename: string) {
  return new File([blob], filename, { type: blob.type })
}

export function ImageManager({
  productId,
  images,
  variantId,
}: {
  productId: string
  images: ProductImage[]
  variantId?: string
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [cropTarget, setCropTarget] = useState<CropTarget | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCropTarget({ kind: 'new', previewUrl: URL.createObjectURL(file), file })
  }

  function handleCortarClick(image: ProductImage) {
    setCropTarget({ kind: 'existing', imageId: image.id, url: image.url })
  }

  function closeCropModal() {
    if (cropTarget?.kind === 'new') URL.revokeObjectURL(cropTarget.previewUrl)
    setCropTarget(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleCropConfirm(blob: Blob) {
    if (!cropTarget) return
    setPending(true)
    setError(null)

    const formData = new FormData()
    formData.set('file', blobToFile(blob, 'foto.jpg'))

    const result =
      cropTarget.kind === 'new'
        ? await uploadProductImage(productId, formData, variantId)
        : await replaceProductImage(cropTarget.imageId, productId, formData)

    setPending(false)
    if (result?.error) {
      setError(result.error)
      return
    }
    closeCropModal()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((image, index) => (
          <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200">
            <Image src={image.url} alt="" fill sizes="200px" className="object-cover" />

            <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent p-1">
              <form action={() => moveProductImage(productId, image.id, 'left', variantId)}>
                <button
                  type="submit"
                  disabled={index === 0}
                  className="rounded-full bg-black/60 p-1 text-white disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Mover para a esquerda"
                >
                  <ChevronLeftIcon className="h-3.5 w-3.5" />
                </button>
              </form>
              <form action={() => moveProductImage(productId, image.id, 'right', variantId)}>
                <button
                  type="submit"
                  disabled={index === images.length - 1}
                  className="rounded-full bg-black/60 p-1 text-white disabled:cursor-not-allowed disabled:opacity-30"
                  aria-label="Mover para a direita"
                >
                  <ChevronRightIcon className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent p-1.5">
              <button
                type="button"
                onClick={() => handleCortarClick(image)}
                className="rounded-full bg-black/60 px-2 py-1 text-xs text-white"
              >
                Cortar
              </button>
              <form action={() => deleteProductImage(image.id, productId)}>
                <button type="submit" className="rounded-full bg-black/60 px-2 py-1 text-xs text-white">
                  Remover
                </button>
              </form>
            </div>
          </div>
        ))}
        {images.length === 0 && (
          <p className="col-span-full text-sm text-neutral-400">Nenhuma imagem cadastrada.</p>
        )}
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileSelect}
          className="text-sm text-neutral-600"
        />
        <p className="mt-1 text-xs text-neutral-500">Ao escolher um arquivo, você recorta antes de salvar.</p>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {cropTarget && (
        <ImageCropModal
          imageSrc={cropTarget.kind === 'new' ? cropTarget.previewUrl : cropTarget.url}
          aspect={1}
          onCancel={closeCropModal}
          onConfirm={handleCropConfirm}
        />
      )}
      {pending && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="rounded-lg bg-white px-4 py-3 text-sm text-neutral-700 shadow">Salvando imagem...</div>
        </div>
      )}
    </div>
  )
}
