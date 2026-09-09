'use client'

import { useState, useTransition } from 'react'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmButton } from '@/components/ui/confirm-button'
import { formatBRL, formatDate } from '@/lib/utils'
import { toggleRuleStatus, deleteRateRule } from './actions'
import { RateRuleForm } from './RateRuleForm'

const METHOD_LABELS: Record<string, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  debito: 'Débito',
  credito: 'Crédito',
}

export type RateRuleRow = {
  id: string
  machine_id: string
  method: string
  installments: number
  card_brand: string | null
  percentage: number
  fixed_value: number | null
  period_start: string | null
  period_end: string | null
  status: string
}

export function RateRuleTable({ machineId, rules }: { machineId: string; rules: RateRuleRow[] }) {
  const [pending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <>
      {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <Table>
        <Thead>
          <Th>Forma</Th>
          <Th>Parcelas</Th>
          <Th>Bandeira</Th>
          <Th>Taxa %</Th>
          <Th>Taxa fixa</Th>
          <Th>Vigência</Th>
          <Th>Status</Th>
          <Th></Th>
        </Thead>
        <tbody>
          {rules.length === 0 ? (
            <EmptyState message="Nenhuma taxa cadastrada para esta máquina." />
          ) : (
            rules.map((rule) =>
              editingId === rule.id ? (
                <tr key={rule.id}>
                  <td colSpan={8} className="p-3">
                    <RateRuleForm machineId={machineId} rule={rule} onDone={() => setEditingId(null)} />
                  </td>
                </tr>
              ) : (
                <Tr key={rule.id}>
                  <Td>{METHOD_LABELS[rule.method] ?? rule.method}</Td>
                  <Td>{rule.installments}x</Td>
                  <Td>{rule.card_brand ?? 'Qualquer'}</Td>
                  <Td>{rule.percentage.toFixed(2)}%</Td>
                  <Td>{rule.fixed_value ? formatBRL(rule.fixed_value) : '-'}</Td>
                  <Td className="whitespace-nowrap text-xs text-neutral-500">
                    {rule.period_start ? formatDate(rule.period_start) : 'sempre'} –{' '}
                    {rule.period_end ? formatDate(rule.period_end) : 'sempre'}
                  </Td>
                  <Td>
                    <Badge tone={rule.status === 'ativa' ? 'green' : 'neutral'}>
                      {rule.status === 'ativa' ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" disabled={pending} onClick={() => setEditingId(rule.id)}>
                        Editar
                      </Button>
                      <ConfirmButton
                        variant="secondary"
                        disabled={pending}
                        confirmMessage={rule.status === 'ativa' ? 'Inativar esta taxa?' : 'Reativar esta taxa?'}
                        historyNote="A taxa não é apagada — orçamentos/vendas antigos continuam mostrando a taxa que foi aplicada na época."
                        onConfirm={() =>
                          startTransition(() => {
                            toggleRuleStatus(rule.id, rule.status === 'ativa' ? 'inativa' : 'ativa')
                          })
                        }
                      >
                        {rule.status === 'ativa' ? 'Desativar' : 'Ativar'}
                      </ConfirmButton>
                      <ConfirmButton
                        variant="danger"
                        disabled={pending}
                        confirmMessage="Excluir esta taxa definitivamente?"
                        historyNote="Só é possível se ela nunca tiver sido usada em nenhum orçamento — caso contrário, use Desativar."
                        onConfirm={() =>
                          startTransition(async () => {
                            const result = await deleteRateRule(rule.id)
                            if (result.error) setError(result.error)
                          })
                        }
                      >
                        Excluir
                      </ConfirmButton>
                    </div>
                  </Td>
                </Tr>
              ),
            )
          )}
        </tbody>
      </Table>
    </>
  )
}
