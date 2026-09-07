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
}

const AUTO_ADVANCE_MS = 6000

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

  return (
    <section
      className="relative overflow-hidden rounded-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={
          banner.image_url
            ? 'bg-cover bg-center px-8 py-16 text-center text-white sm:py-20'
            : 'bg-gradient-to-br from-brand-teal to-brand-navy px-8 py-16 text-center text-white sm:py-20'
        }
        style={
          banner.image_url
            ? {
                backgroundImage: `linear-gradient(rgba(10,20,35,0.55), rgba(10,20,35,0.55)), url(${banner.image_url})`,
              }
            : undefined
        }
      >
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

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
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
