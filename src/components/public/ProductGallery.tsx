'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { ChevronLeftIcon, ChevronRightIcon, XIcon, ZoomIcon } from '@/components/ui/icons'

type GalleryImage = { url: string }

export function ProductGallery({
  images,
  productName,
  discountPercent,
  outOfStock,
}: {
  images: GalleryImage[]
  productName: string
  discountPercent?: number | null
  outOfStock?: boolean
}) {
  const [index, setIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const hasImages = images.length > 0
  const hasMultiple = images.length > 1
  const current = images[index]

  function goTo(nextIndex: number) {
    setIndex((nextIndex + images.length) % images.length)
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || !hasMultiple) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(delta) > 40) goTo(delta > 0 ? index - 1 : index + 1)
    touchStartX.current = null
  }

  return (
    <div className="space-y-3">
      <div
        className="group relative aspect-square overflow-hidden rounded-2xl bg-neutral-100"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {hasImages ? (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="absolute inset-0 cursor-zoom-in"
            aria-label="Ampliar imagem"
          >
            <Image
              src={current.url}
              alt={productName}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
              priority
            />
            <span className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
              <ZoomIcon className="h-3.5 w-3.5" />
              Ampliar
            </span>
          </button>
        ) : (
          <div className="flex h-full items-center justify-center text-neutral-400">Sem imagem</div>
        )}

        {discountPercent ? (
          <span className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">
            -{discountPercent}%
          </span>
        ) : null}
        {outOfStock && (
          <span className="absolute right-3 top-3 rounded-full bg-neutral-900/80 px-2.5 py-1 text-xs font-semibold text-white">
            Esgotado
          </span>
        )}

        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-neutral-700 shadow transition hover:bg-white sm:flex"
              aria-label="Imagem anterior"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/90 p-2 text-neutral-700 shadow transition hover:bg-white sm:flex"
              aria-label="Próxima imagem"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
              {images.map((image, i) => (
                <span
                  key={image.url}
                  className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((image, i) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setIndex(i)}
              className={`relative aspect-square overflow-hidden rounded-lg bg-neutral-100 ring-2 transition ${
                i === index ? 'ring-brand-navy' : 'ring-transparent hover:ring-neutral-300'
              }`}
              aria-label={`Ver foto ${i + 1}`}
            >
              <Image src={image.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && hasImages && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
            aria-label="Fechar"
          >
            <XIcon className="h-5 w-5" />
          </button>

          <div className="relative h-full max-h-[85vh] w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <Image src={current.url} alt={productName} fill sizes="100vw" className="object-contain" />
          </div>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goTo(index - 1)
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:left-4"
                aria-label="Anterior"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  goTo(index + 1)
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 sm:right-4"
                aria-label="Próxima"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
