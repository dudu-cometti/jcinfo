'use client'

import { useActionState, useRef } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { uploadProductImage, deleteProductImage } from '../actions'

type ProductImage = { id: string; url: string }

export function ImageManager({ productId, images }: { productId: string; images: ProductImage[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | undefined, formData: FormData) => {
      const result = await uploadProductImage(productId, formData)
      if (!result?.error) formRef.current?.reset()
      return result
    },
    undefined,
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {images.map((image) => (
          <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200">
            <Image src={image.url} alt="" fill sizes="200px" className="object-cover" />
            <form action={() => deleteProductImage(image.id, productId)} className="absolute right-1 top-1">
              <button
                type="submit"
                className="rounded-full bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100"
              >
                Remover
              </button>
            </form>
          </div>
        ))}
        {images.length === 0 && (
          <p className="col-span-full text-sm text-neutral-400">Nenhuma imagem cadastrada.</p>
        )}
      </div>

      <form ref={formRef} action={formAction} className="flex items-center gap-3">
        <input
          type="file"
          name="file"
          accept="image/png,image/jpeg,image/webp"
          required
          className="text-sm text-neutral-600"
        />
        <Button type="submit" variant="secondary" disabled={pending}>
          {pending ? 'Enviando...' : 'Adicionar imagem'}
        </Button>
      </form>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </div>
  )
}
