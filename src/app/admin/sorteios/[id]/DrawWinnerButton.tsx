'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { drawRaffleWinner } from '@/lib/actions/raffles'

export function DrawWinnerButton({ raffleId, entryCount }: { raffleId: string; entryCount: number }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDraw() {
    if (!confirm(`Sortear o vencedor entre ${entryCount} participante(s)? Esta ação não pode ser desfeita.`)) return
    setError(null)
    startTransition(async () => {
      const result = await drawRaffleWinner(raffleId)
      if (result?.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  return (
    <div>
      <Button onClick={handleDraw} disabled={isPending || entryCount === 0}>
        {isPending ? 'Sorteando...' : 'Realizar sorteio'}
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
