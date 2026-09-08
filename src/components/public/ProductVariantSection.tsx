'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { WhatsAppButton } from '@/components/public/WhatsAppButton'
import { ProductGallery } from '@/components/public/ProductGallery'
import { ShareProductButton } from '@/components/public/ShareProductButton'
import { formatBRL } from '@/lib/utils'

type Variant = {
  id: string
  color_name: string
  color_hex: string | null
  price: number
  promo_price: number | null
  stock: number
  images: { url: string }[]
}

type CampaignRow = {
  id: string
  name: string
  min_points: number
  campaign_rewards: { reward: { name: string } | null }[]
}

export function ProductVariantSection({
  product,
  brand,
  category,
  basePrice,
  basePromoPrice,
  baseStock,
  baseImages,
  variants,
  whatsappNumber,
  specs,
  activeCampaigns,
  knownCustomer,
}: {
  product: { id: string; name: string; description: string | null; model: string | null; min_stock: number }
  brand: { name: string; slug: string } | null
  category: { name: string } | null
  basePrice: number
  basePromoPrice: number | null
  baseStock: number
  baseImages: { url: string }[]
  variants: Variant[]
  whatsappNumber: string
  specs: { label: string; value: string }[]
  activeCampaigns: CampaignRow[]
  knownCustomer?: { name: string; phone: string } | null
}) {
  const [selectedId, setSelectedId] = useState<string | null>(variants[0]?.id ?? null)
  const selected = variants.find((v) => v.id === selectedId) ?? null

  const price = selected?.price ?? basePrice
  const promoPrice = selected ? selected.promo_price : basePromoPrice
  const stock = selected?.stock ?? baseStock
  const images = selected && selected.images.length > 0 ? selected.images : baseImages
  const discountPercent = promoPrice ? Math.round(((price - promoPrice) / price) * 100) : null
  const outOfStock = stock === 0
  const lowStock = !outOfStock && stock <= product.min_stock
  const estimatedPoints = Math.floor(promoPrice ?? price)
  const displayName = selected ? `${product.name} - ${selected.color_name}` : product.name

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={images} productName={product.name} discountPercent={discountPercent} outOfStock={outOfStock} />

        <div className="space-y-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                {category && <p className="text-sm text-neutral-500">{category.name}</p>}
                <h1 className="text-2xl font-semibold text-neutral-900 sm:text-3xl">{product.name}</h1>
              </div>
              <ShareProductButton />
            </div>
            {(brand || product.model) && (
              <p className="mt-1 text-sm text-neutral-500">
                {brand ? (
                  <Link href={`/marca/${brand.slug}`} className="hover:underline">
                    {brand.name}
                  </Link>
                ) : null}
                {brand && product.model ? ' · ' : null}
                {product.model}
              </p>
            )}
          </div>

          {variants.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-medium text-neutral-700">Cor: {selected?.color_name}</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedId(v.id)}
                    disabled={v.stock === 0}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      v.id === selectedId ? 'border-brand-navy bg-brand-navy/5' : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-neutral-300"
                      style={{ backgroundColor: v.color_hex ?? '#e5e5e5' }}
                    />
                    {v.color_name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
              {promoPrice ? (
                <>
                  <span className="text-3xl font-semibold text-brand-navy sm:text-4xl">{formatBRL(promoPrice)}</span>
                  <span className="text-base text-neutral-400 line-through">{formatBRL(price)}</span>
                  {discountPercent && <Badge tone="red">-{discountPercent}%</Badge>}
                </>
              ) : (
                <span className="text-3xl font-semibold text-neutral-900 sm:text-4xl">{formatBRL(price)}</span>
              )}
            </div>
            {promoPrice && <p className="text-sm text-green-700">Você economiza {formatBRL(price - promoPrice)}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            {outOfStock ? (
              <Badge tone="red">Fora de estoque</Badge>
            ) : lowStock ? (
              <Badge tone="yellow">Últimas unidades</Badge>
            ) : (
              <Badge tone="green">Em estoque</Badge>
            )}
          </div>

          {product.description && <p className="whitespace-pre-line text-neutral-600">{product.description}</p>}

          <div className="hidden lg:block">
            <WhatsAppButton
              whatsappNumber={whatsappNumber}
              productId={product.id}
              productName={displayName}
              knownCustomer={knownCustomer}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-700 sm:w-auto sm:px-8"
            />
          </div>

          {specs.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h2 className="mb-2 text-sm font-semibold text-neutral-900">Ficha técnica</h2>
              <dl className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                {specs.map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-center justify-between gap-3 border-b border-neutral-100 py-1.5 last:border-0 sm:border-0 sm:py-1"
                  >
                    <dt className="text-sm text-neutral-500">{spec.label}</dt>
                    <dd className="text-sm font-medium text-neutral-800">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {activeCampaigns.length > 0 && (
            <div className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/10 p-4">
              <p className="text-sm font-medium text-brand-navy">
                Comprando este produto você acumula até <strong>{estimatedPoints.toLocaleString('pt-BR')} pontos</strong>.
              </p>
              <ul className="mt-2 space-y-1.5">
                {activeCampaigns.map((campaign) => {
                  const rewardNames = campaign.campaign_rewards
                    .map((cr) => cr.reward?.name)
                    .filter((name): name is string => Boolean(name))
                  const label =
                    rewardNames.length > 0
                      ? `A partir de ${campaign.min_points.toLocaleString('pt-BR')} pontos: ${rewardNames.join(', ')}`
                      : campaign.name
                  return (
                    <li key={campaign.id} className="flex items-start gap-2 text-sm text-brand-teal">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand-teal" />
                      {label}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white p-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            {promoPrice ? (
              <p className="truncate text-lg font-semibold text-brand-navy">{formatBRL(promoPrice)}</p>
            ) : (
              <p className="truncate text-lg font-semibold text-neutral-900">{formatBRL(price)}</p>
            )}
          </div>
          <WhatsAppButton
            whatsappNumber={whatsappNumber}
            productId={product.id}
            productName={displayName}
            knownCustomer={knownCustomer}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          />
        </div>
      </div>
    </>
  )
}
