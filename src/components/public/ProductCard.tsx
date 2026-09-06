import Link from 'next/link'
import Image from 'next/image'
import { formatBRL } from '@/lib/utils'

export type ProductCardData = {
  id: string
  name: string
  slug: string
  price: number
  promo_price: number | null
  stock: number
  image_url?: string | null
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const discount = product.promo_price
    ? Math.round(((product.price - product.promo_price) / product.price) * 100)
    : null

  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:border-brand-navy/30 hover:shadow-md"
    >
      <div className="relative aspect-square bg-neutral-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 22vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-400">Sem imagem</div>
        )}
        {discount && (
          <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-xs font-semibold text-white">
            -{discount}%
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-neutral-900/80 px-2 py-1 text-xs font-semibold text-white">
            Esgotado
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-neutral-800">{product.name}</h3>
        <div className="mt-auto">
          {product.promo_price ? (
            <div>
              <span className="text-xs text-neutral-400 line-through">{formatBRL(product.price)}</span>
              <p className="text-base font-semibold text-brand-navy">{formatBRL(product.promo_price)}</p>
            </div>
          ) : (
            <p className="text-base font-semibold text-neutral-900">{formatBRL(product.price)}</p>
          )}
        </div>
      </div>
    </Link>
  )
}
