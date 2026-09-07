'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export type HeroBanner = {
  id: string
  title: string
  subtitle: string | null
  cta_label: string | null
  cta_href: string | null
  image_url: string | null
  image_url_mobile: string | null
  show_text_overlay: boolean
  // 'contain' is for images whose aspect ratio we don't control (e.g. a
  // linked campaign's square photo) — shown whole, on a blurred backdrop,
  // instead of being cropped to fill the wide 21:9 desktop frame.
  imageFit?: 'cover' | 'contain'
}

const AUTO_ADVANCE_MS = 6000
const OVERLAY = 'linear-gradient(rgba(10,20,35,0.55), rgba(10,20,35,0.55))'

export function HeroCarousel({ banners }: { banners: HeroBanner[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (banners.length < 2 || paused) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length)
    }, AUTO_ADVANCE_MS)
    return () => clearInterval(timer)
  }, [banners.length, paused])

  if (banners.length === 0) return null

  const banner = banners[index]
  const desktopImage = banner.image_url ?? banner.image_url_mobile
  const mobileImage = banner.image_url_mobile ?? banner.image_url
  const hasImage = Boolean(desktopImage || mobileImage)
  // Matches the recommended upload sizes exactly (1080x1080 mobile,
  // 2100x900 desktop) so "cover" never has to guess/crop unpredictably —
  // an approximate min-height here previously let the real box ratio drift
  // away from whatever ratio was recommended, cropping images that were
  // sized "correctly" by that stale advice.
  const aspectClasses = 'aspect-square md:aspect-[21/9]'

  const contain = banner.imageFit === 'contain'

  const backgroundLayers = hasImage ? (
    <>
      <div className="absolute inset-0 md:hidden">
        {contain && mobileImage && (
          <div className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl" style={{ backgroundImage: `url(${mobileImage})` }} />
        )}
        <div
          className={`absolute inset-0 bg-center ${contain ? 'bg-contain bg-no-repeat' : 'bg-cover'}`}
          style={{ backgroundImage: mobileImage ? `${banner.show_text_overlay ? OVERLAY + ', ' : ''}url(${mobileImage})` : OVERLAY }}
        />
      </div>
      <div className="absolute inset-0 hidden md:block">
        {contain && desktopImage && (
          <div className="absolute inset-0 scale-110 bg-cover bg-center blur-2xl" style={{ backgroundImage: `url(${desktopImage})` }} />
        )}
        <div
          className={`absolute inset-0 bg-center ${contain ? 'bg-contain bg-no-repeat' : 'bg-cover'}`}
          style={{ backgroundImage: desktopImage ? `${banner.show_text_overlay ? OVERLAY + ', ' : ''}url(${desktopImage})` : OVERLAY }}
        />
      </div>
    </>
  ) : (
    <div className="absolute inset-0 bg-gradient-to-br from-brand-teal to-brand-navy" />
  )

  const content = banner.show_text_overlay && (
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 py-8 text-center text-white sm:px-10">
      <h1 className="text-3xl font-semibold sm:text-4xl">{banner.title}</h1>
      {banner.subtitle && <p className="mx-auto mt-3 max-w-xl text-white/80">{banner.subtitle}</p>}
      {banner.cta_label && banner.cta_href && (
        <Link
          href={banner.cta_href}
          className="mt-6 inline-block rounded-lg bg-brand-cyan px-6 py-3 text-sm font-semibold text-brand-navy hover:brightness-95"
        >
          {banner.cta_label}
        </Link>
      )}
    </div>
  )

  return (
    <section
      className={`relative overflow-hidden rounded-3xl ${aspectClasses}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {backgroundLayers}

      {!banner.show_text_overlay && banner.cta_href ? (
        <Link href={banner.cta_href} className="absolute inset-0 z-10" aria-label={banner.title} />
      ) : (
        content
      )}

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {banners.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Ir para o destaque ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
