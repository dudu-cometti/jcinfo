'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { createShareToken, revokeShareToken } from '@/lib/actions/orcamentos'

type ShareToken = { id: string; token: string; revoked: boolean; created_at: string }

export function ShareImageButtons({
  orcamentoId,
  shareTokens,
  whatsappMessage,
}: {
  orcamentoId: string
  shareTokens: ShareToken[]
  whatsappMessage: string
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const activeToken = shareTokens.find((t) => !t.revoked) ?? null

  const imageUrl = activeToken ? `${window.location.origin}/api/orcamentos/${activeToken.token}/image` : null

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const result = await createShareToken(orcamentoId)
      if (result.error) setError(result.error)
    })
  }

  function handleRevoke(tokenId: string) {
    startTransition(async () => {
      await revokeShareToken(tokenId, orcamentoId)
    })
  }

  if (!activeToken) {
    return (
      <div className="space-y-2">
        <Button variant="secondary" onClick={handleGenerate} disabled={isPending}>
          {isPending ? 'Gerando...' : 'Gerar imagem para enviar'}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={imageUrl!} download target="_blank" rel="noreferrer">
        <Button variant="secondary">Baixar imagem</Button>
      </a>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${whatsappMessage}\n${imageUrl}`)}`}
        target="_blank"
        rel="noreferrer"
      >
        <Button>Enviar no WhatsApp</Button>
      </a>
      <button
        type="button"
        onClick={() => handleRevoke(activeToken.id)}
        disabled={isPending}
        className="text-xs text-neutral-500 hover:underline"
      >
        Revogar link
      </button>
    </div>
  )
}
