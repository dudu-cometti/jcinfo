'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { ChevronUpIcon, ChevronDownIcon } from '@/components/ui/icons'
import { formatBRL } from '@/lib/utils'
import { VariantForm } from './VariantForm'
import { ImageManager } from './ImageManager'
import {
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  moveProductVariant,
} from '../actions'

type VariantImage = { id: string; url: string }

export type Variant = {
  id: string
  color_name: string
  color_hex: string | null
  price: number
  promo_price: number | null
  stock: number
  sku: string | null
  status: 'ativo' | 'inativo'
  images: VariantImage[]
}

function VariantRow({
  productId,
  variant,
  isFirst,
  isLast,
}: {
  productId: string
  variant: Variant
  isFirst: boolean
  isLast: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleDelete() {
    if (!confirm(`Excluir a cor "${variant.color_name}"?`)) return
    const result = await deleteProductVariant(variant.id, productId)
    if (result?.error) setDeleteError(result.error)
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center gap-3 p-3">
        <span
          className="h-6 w-6 shrink-0 rounded-full border border-neutral-300"
          style={{ backgroundColor: variant.color_hex ?? '#e5e5e5' }}
        />
        <button type="button" onClick={() => setExpanded((v) => !v)} className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-left">
          <span className="font-medium text-neutral-900">{variant.color_name}</span>
          <span className="text-sm text-neutral-500">
            {variant.promo_price ? (
              <>
                <span className="line-through">{formatBRL(variant.price)}</span> {formatBRL(variant.promo_price)}
              </>
            ) : (
              formatBRL(variant.price)
            )}
          </span>
          <span className="text-sm text-neutral-500">Estoque: {variant.stock}</span>
          <Badge tone={variant.status === 'ativo' ? 'green' : 'neutral'}>{variant.status === 'ativo' ? 'Ativo' : 'Inativo'}</Badge>
        </button>
        <div className="flex shrink-0 items-center gap-1">
          <form action={() => moveProductVariant(productId, variant.id, 'up')}>
            <button type="submit" disabled={isFirst} className="rounded p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30" aria-label="Mover para cima">
              <ChevronUpIcon className="h-4 w-4" />
            </button>
          </form>
          <form action={() => moveProductVariant(productId, variant.id, 'down')}>
            <button type="submit" disabled={isLast} className="rounded p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30" aria-label="Mover para baixo">
              <ChevronDownIcon className="h-4 w-4" />
            </button>
          </form>
          <button type="button" onClick={() => setExpanded((v) => !v)} className="px-2 text-sm text-neutral-600 hover:underline">
            {expanded ? 'Fechar' : 'Editar'}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-6 border-t border-neutral-100 p-4">
          <VariantForm
            action={updateProductVariant.bind(null, variant.id, productId)}
            defaultValues={variant}
            submitLabel="Salvar cor"
          />

          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700">Fotos desta cor</p>
            <ImageManager productId={productId} images={variant.images} variantId={variant.id} />
          </div>

          <button type="button" onClick={handleDelete} className="text-sm text-red-600 hover:underline">
            Excluir esta cor
          </button>
          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
        </div>
      )}
    </div>
  )
}

export function VariantManager({ productId, variants }: { productId: string; variants: Variant[] }) {
  return (
    <div className="space-y-3">
      {variants.map((variant, index) => (
        <VariantRow
          key={variant.id}
          productId={productId}
          variant={variant}
          isFirst={index === 0}
          isLast={index === variants.length - 1}
        />
      ))}
      {variants.length === 0 && <p className="text-sm text-neutral-400">Nenhuma cor cadastrada ainda.</p>}

      <Modal triggerLabel="+ Nova cor" title="Nova cor">
        <VariantForm action={createProductVariant.bind(null, productId)} submitLabel="Criar cor" />
      </Modal>
    </div>
  )
}
