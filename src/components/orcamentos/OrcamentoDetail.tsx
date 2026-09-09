'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmButton } from '@/components/ui/confirm-button'
import { Table, Thead, Th, Tr, Td } from '@/components/ui/table'
import { Textarea } from '@/components/ui/input'
import { formatBRL, formatDateTime } from '@/lib/utils'
import { OrcamentoStatusBadge } from './OrcamentoStatusBadge'
import { ShareImageButtons } from './ShareImageButtons'
import { sendOrcamento, approveOrcamento, cancelOrcamento, convertOrcamento } from '@/lib/actions/orcamentos'

type Item = {
  id: string
  product_name_snapshot: string
  variant_color_snapshot: string | null
  image_url_snapshot: string | null
  unit_price_snapshot: number
  quantity: number
  subtotal_snapshot: number
  stock_available_at_creation: number | null
}

type Orcamento = {
  id: string
  customer_name_snapshot: string
  status: string
  subtotal: number
  discount: number
  freight_value: number
  base_value: number
  machine_name_snapshot: string | null
  payment_method: string | null
  card_brand_snapshot: string | null
  installments: number
  percentage_applied: number | null
  fixed_value_applied: number | null
  final_value: number
  installment_value: number | null
  last_installment_value: number | null
  rate_period_start: string | null
  rate_period_end: string | null
  validity_days: number
  expires_at: string | null
  notes: string | null
  converted_sale_id: string | null
  cancelled_reason: string | null
  created_at: string
}

const METHOD_LABELS: Record<string, string> = { pix: 'Pix', dinheiro: 'Dinheiro', debito: 'Débito', credito: 'Crédito' }

export function OrcamentoDetail({
  orcamento,
  items,
  shareTokens,
  basePath,
  salesPath,
}: {
  orcamento: Orcamento
  items: Item[]
  shareTokens: { id: string; token: string; revoked: boolean; created_at: string }[]
  basePath: string
  salesPath: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [showCancel, setShowCancel] = useState(false)

  function run(action: () => Promise<{ error?: string } | undefined>) {
    setError(null)
    startTransition(async () => {
      const result = await action()
      if (result?.error) setError(result.error)
      else router.refresh()
    })
  }

  function handleConvert() {
    setError(null)
    startTransition(async () => {
      const result = await convertOrcamento(orcamento.id)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.saleId) router.push(`${salesPath}/${result.saleId}`)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Orçamento — {orcamento.customer_name_snapshot}</h1>
          <p className="text-xs text-neutral-500">{formatDateTime(orcamento.created_at)}</p>
        </div>
        <OrcamentoStatusBadge status={orcamento.status} />
      </div>

      <Card>
        <Table>
          <Thead>
            <Th>Produto</Th>
            <Th>Cor</Th>
            <Th>Qtd</Th>
            <Th>Preço unit.</Th>
            <Th>Subtotal</Th>
          </Thead>
          <tbody>
            {items.map((item) => (
              <Tr key={item.id}>
                <Td>{item.product_name_snapshot}</Td>
                <Td>{item.variant_color_snapshot ?? '-'}</Td>
                <Td>{item.quantity}</Td>
                <Td>{formatBRL(item.unit_price_snapshot)}</Td>
                <Td>{formatBRL(item.subtotal_snapshot)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>

      <Card className="space-y-2 text-sm">
        <div className="flex justify-between text-neutral-500">
          <span>Subtotal dos produtos</span>
          <span>{formatBRL(orcamento.subtotal)}</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Desconto</span>
          <span>-{formatBRL(orcamento.discount)}</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Frete</span>
          <span>+{formatBRL(orcamento.freight_value)}</span>
        </div>
        <div className="flex justify-between text-neutral-500">
          <span>Forma de pagamento</span>
          <span>
            {orcamento.machine_name_snapshot ?? '-'} · {METHOD_LABELS[orcamento.payment_method ?? ''] ?? '-'}
            {orcamento.card_brand_snapshot ? ` · ${orcamento.card_brand_snapshot}` : ''}
          </span>
        </div>
        {orcamento.percentage_applied != null && orcamento.percentage_applied > 0 && (
          <div className="flex justify-between text-neutral-500">
            <span>Taxa aplicada</span>
            <span>
              {orcamento.percentage_applied.toFixed(2)}%
              {orcamento.fixed_value_applied ? ` + ${formatBRL(orcamento.fixed_value_applied)}` : ''}
              {orcamento.rate_period_start || orcamento.rate_period_end ? (
                <span className="ml-1 text-xs text-neutral-400">
                  (vigência {orcamento.rate_period_start ?? 'sempre'} – {orcamento.rate_period_end ?? 'sempre'})
                </span>
              ) : null}
            </span>
          </div>
        )}
        <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-neutral-900">
          <span>Total</span>
          <span>{formatBRL(orcamento.final_value)}</span>
        </div>
        {orcamento.installments > 1 ? (
          <p className="text-xs text-neutral-500">
            {orcamento.installments - 1}x de {formatBRL(orcamento.installment_value ?? 0)} + 1x de{' '}
            {formatBRL(orcamento.last_installment_value ?? 0)}
          </p>
        ) : (
          <p className="text-xs text-neutral-500">Pagamento único de {formatBRL(orcamento.last_installment_value ?? orcamento.final_value)}</p>
        )}
        <p className="text-xs text-neutral-500">
          Validade: {orcamento.validity_days} dia(s) — expira em {orcamento.expires_at ? formatDateTime(orcamento.expires_at) : '-'}
        </p>
        {orcamento.notes && <p className="text-xs text-neutral-500">Observações: {orcamento.notes}</p>}
        {orcamento.cancelled_reason && <p className="text-xs text-red-600">Cancelado: {orcamento.cancelled_reason}</p>}
      </Card>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <Card className="space-y-3">
        <h2 className="text-sm font-semibold text-neutral-900">Ações</h2>
        <div className="flex flex-wrap gap-2">
          {orcamento.status === 'rascunho' && basePath === '/vendedor/orcamentos' && (
            <a href={`${basePath}/${orcamento.id}/editar`}>
              <Button variant="secondary">Editar</Button>
            </a>
          )}
          {orcamento.status === 'rascunho' && (
            <Button disabled={isPending} onClick={() => run(() => sendOrcamento(orcamento.id))}>
              Enviar ao cliente
            </Button>
          )}
          {orcamento.status === 'enviado' && (
            <Button disabled={isPending} onClick={() => run(() => approveOrcamento(orcamento.id))}>
              Marcar como aprovado
            </Button>
          )}
          {(orcamento.status === 'enviado' || orcamento.status === 'aprovado') && (
            <Button variant="primary" disabled={isPending} onClick={handleConvert}>
              {isPending ? 'Convertendo...' : 'Converter em venda'}
            </Button>
          )}
          {orcamento.status !== 'convertido' && orcamento.status !== 'cancelado' && (
            <Button variant="danger" disabled={isPending} onClick={() => setShowCancel((v) => !v)}>
              Cancelar
            </Button>
          )}
        </div>

        {showCancel && (
          <div className="space-y-2">
            <Textarea
              placeholder="Motivo do cancelamento (opcional)"
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <ConfirmButton
              variant="danger"
              disabled={isPending}
              confirmMessage="Cancelar este orçamento?"
              historyNote="O orçamento não é apagado — ele fica marcado como cancelado, com o motivo, para histórico."
              onConfirm={() => run(() => cancelOrcamento(orcamento.id, cancelReason))}
            >
              Confirmar cancelamento
            </ConfirmButton>
          </div>
        )}

        {orcamento.converted_sale_id && (
          <p className="text-sm text-green-700">
            Convertido em venda —{' '}
            <a href={`${salesPath}/${orcamento.converted_sale_id}`} className="underline">
              ver venda
            </a>
          </p>
        )}
      </Card>

      {(orcamento.status === 'enviado' || orcamento.status === 'aprovado') && (
        <Card className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-900">Enviar ao cliente</h2>
          <ShareImageButtons
            orcamentoId={orcamento.id}
            shareTokens={shareTokens}
            whatsappMessage={`Olá! Segue o orçamento #${orcamento.id.slice(0, 8)} da JC Info.`}
          />
        </Card>
      )}

      <a href={basePath} className="text-sm text-neutral-500 hover:underline">
        ← Voltar
      </a>
    </div>
  )
}
