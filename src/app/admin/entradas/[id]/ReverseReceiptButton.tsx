'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ConfirmButton } from '@/components/ui/confirm-button'
import { reverseStockReceipt } from '../actions'

export function ReverseReceiptButton({ receiptId }: { receiptId: string }) {
  const router = useRouter()
  const [showReason, setShowReason] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!showReason) {
    return (
      <Button variant="danger" onClick={() => setShowReason(true)}>
        Estornar entrada
      </Button>
    )
  }

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Motivo do estorno (obrigatório)"
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex items-center gap-2">
        <ConfirmButton
          variant="danger"
          disabled={isPending || !reason.trim()}
          confirmMessage="Estornar esta entrada de estoque?"
          historyNote="A entrada original não é apagada nem editada — este estorno cria uma movimentação negativa nova, referenciando a entrada."
          onConfirm={() =>
            startTransition(async () => {
              const result = await reverseStockReceipt(receiptId, reason)
              if (result.error) {
                setError(result.error)
                return
              }
              router.refresh()
            })
          }
        >
          {isPending ? 'Estornando...' : 'Confirmar estorno'}
        </ConfirmButton>
        <button type="button" onClick={() => setShowReason(false)} className="text-sm text-neutral-500 hover:underline">
          Cancelar
        </button>
      </div>
    </div>
  )
}
