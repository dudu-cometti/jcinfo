'use client'

import { useTransition } from 'react'
import { moveHomeBanner, toggleHomeBannerActive, deleteHomeBanner } from './actions'

export function BannerRowActions({
  bannerId,
  active,
  isFirst,
  isLast,
}: {
  bannerId: string
  active: boolean
  isFirst: boolean
  isLast: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center justify-end gap-3 text-sm">
      <button
        type="button"
        disabled={isPending || isFirst}
        onClick={() => startTransition(() => moveHomeBanner(bannerId, 'up'))}
        className="text-neutral-500 hover:text-neutral-900 disabled:opacity-30"
        aria-label="Mover para cima"
      >
        Subir
      </button>
      <button
        type="button"
        disabled={isPending || isLast}
        onClick={() => startTransition(() => moveHomeBanner(bannerId, 'down'))}
        className="text-neutral-500 hover:text-neutral-900 disabled:opacity-30"
        aria-label="Mover para baixo"
      >
        Descer
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => toggleHomeBannerActive(bannerId, !active))}
        className="text-neutral-600 hover:underline"
      >
        {active ? 'Desativar' : 'Ativar'}
      </button>
      <form
        action={() => deleteHomeBanner(bannerId)}
        onSubmit={(e) => {
          if (!confirm('Excluir este destaque?')) e.preventDefault()
        }}
      >
        <button type="submit" className="text-red-600 hover:underline">
          Excluir
        </button>
      </form>
    </div>
  )
}
