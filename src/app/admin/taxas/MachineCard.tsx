'use client'

import { useState, useTransition } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmButton } from '@/components/ui/confirm-button'
import { MachineForm } from './MachineForm'
import { RateRuleForm } from './RateRuleForm'
import { RateRuleTable, type RateRuleRow } from './RateRuleTable'
import { toggleMachineStatus, deleteMachine } from './actions'

type Machine = { id: string; name: string; min_installments: number; max_installments: number; status: string }

export function MachineCard({ machine, rules }: { machine: Machine; rules: RateRuleRow[] }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  return (
    <Card>
      {editing ? (
        <MachineForm machine={machine} onDone={() => setEditing(false)} />
      ) : (
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">{machine.name}</h2>
            <p className="text-xs text-neutral-500">
              Parcelas de {machine.min_installments}x a {machine.max_installments}x
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={machine.status === 'ativo' ? 'green' : 'neutral'}>
              {machine.status === 'ativo' ? 'Ativa' : 'Inativa'}
            </Badge>
            <Button variant="secondary" disabled={pending} onClick={() => setEditing(true)}>
              Editar
            </Button>
            <ConfirmButton
              variant="secondary"
              disabled={pending}
              confirmMessage={machine.status === 'ativo' ? 'Inativar esta máquina?' : 'Reativar esta máquina?'}
              historyNote="A máquina não é apagada — orçamentos/vendas antigos continuam mostrando qual máquina foi usada."
              onConfirm={() =>
                startTransition(() => {
                  toggleMachineStatus(machine.id, machine.status === 'ativo' ? 'inativo' : 'ativo')
                })
              }
            >
              {machine.status === 'ativo' ? 'Desativar' : 'Ativar'}
            </ConfirmButton>
            <ConfirmButton
              variant="danger"
              disabled={pending}
              confirmMessage="Excluir esta máquina definitivamente?"
              historyNote="Só é possível se ela nunca tiver sido usada em nenhum orçamento ou venda — caso contrário, use Desativar."
              onConfirm={() =>
                startTransition(async () => {
                  const result = await deleteMachine(machine.id)
                  if (result.error) setError(result.error)
                })
              }
            >
              Excluir
            </ConfirmButton>
          </div>
        </div>
      )}

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <RateRuleTable machineId={machine.id} rules={rules} />

      <div className="mt-4 border-t border-neutral-100 pt-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Nova taxa</h3>
        <RateRuleForm machineId={machine.id} />
      </div>
    </Card>
  )
}
