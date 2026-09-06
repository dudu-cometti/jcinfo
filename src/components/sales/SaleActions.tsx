'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { confirmSaleAction, completeSaleAction, cancelSaleAction, reverseSaleAction } from '@/lib/actions/sales'

type SaleStatus = 'pendente' | 'confirmada' | 'concluida' | 'cancelada' | 'estornada'

export function SaleActions({
  saleId,
  status,
  isAdmin,
}: {
  saleId: string
  status: SaleStatus
  isAdmin: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [reasonPrompt, setReasonPrompt] = useState<'cancelar' | 'estornar' | null>(null)
  const [reason, setReason] = useState('')

  function run(action: () => Promise<{ error?: string } | undefined>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result?.error) {
        setError(result.error)
        return
      }
      setReasonPrompt(null)
      setReason('')
      router.refresh()
    })
  }

  if (status === 'cancelada' || status === 'estornada') {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {status === 'pendente' && (
          <>
            <Button
              disabled={isPending}
              onClick={() =>
                run(async () => {
                  const result = await confirmSaleAction(saleId)
                  if (!result?.error && 'dataLayer' in window) {
                    ;(window as unknown as { dataLayer: unknown[] }).dataLayer.push({
                      event: 'purchase',
                      transaction_id: saleId,
                    })
                  }
                  return result
                })
              }
            >
              Confirmar venda
            </Button>
            <Button variant="danger" disabled={isPending} onClick={() => setReasonPrompt('cancelar')}>
              Cancelar
            </Button>
          </>
        )}
        {status === 'confirmada' && (
          <>
            <Button disabled={isPending} onClick={() => run(() => completeSaleAction(saleId))}>
              Marcar como concluída
            </Button>
            {isAdmin && (
              <Button variant="danger" disabled={isPending} onClick={() => setReasonPrompt('estornar')}>
                Estornar
              </Button>
            )}
          </>
        )}
        {status === 'concluida' && isAdmin && (
          <Button variant="danger" disabled={isPending} onClick={() => setReasonPrompt('estornar')}>
            Estornar
          </Button>
        )}
      </div>

      {reasonPrompt && (
        <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
          <Textarea
            placeholder={reasonPrompt === 'cancelar' ? 'Motivo do cancelamento (opcional)' : 'Motivo do estorno (obrigatório)'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              variant="danger"
              disabled={isPending}
              onClick={() =>
                run(() =>
                  reasonPrompt === 'cancelar'
                    ? cancelSaleAction(saleId, reason)
                    : reverseSaleAction(saleId, reason),
                )
              }
            >
              Confirmar {reasonPrompt}
            </Button>
            <Button variant="ghost" onClick={() => setReasonPrompt(null)}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
    </div>
  )
}
