'use client'

import { useActionState } from 'react'
import { Field, Input, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createMachine, updateMachine } from './actions'

type Machine = {
  id: string
  name: string
  min_installments: number
  max_installments: number
  status: string
}

export function MachineForm({ machine, onDone }: { machine?: Machine; onDone?: () => void }) {
  const action = machine ? updateMachine.bind(null, machine.id) : createMachine
  const [state, formAction, pending] = useActionState(async (prev: Parameters<typeof action>[0], formData: FormData) => {
    const result = await action(prev, formData)
    if (result?.success) onDone?.()
    return result
  }, undefined)

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Field label="Nome da máquina" htmlFor={`machine-name-${machine?.id ?? 'new'}`}>
        <Input id={`machine-name-${machine?.id ?? 'new'}`} name="name" required defaultValue={machine?.name} placeholder="Ex: Máquina X" />
      </Field>
      <Field label="Parcelas mín." htmlFor={`machine-min-${machine?.id ?? 'new'}`}>
        <Input
          id={`machine-min-${machine?.id ?? 'new'}`}
          name="min_installments"
          type="number"
          min={1}
          defaultValue={machine?.min_installments ?? 1}
          required
        />
      </Field>
      <Field label="Parcelas máx." htmlFor={`machine-max-${machine?.id ?? 'new'}`}>
        <Input
          id={`machine-max-${machine?.id ?? 'new'}`}
          name="max_installments"
          type="number"
          min={1}
          defaultValue={machine?.max_installments ?? 12}
          required
        />
      </Field>
      <Field label="Status" htmlFor={`machine-status-${machine?.id ?? 'new'}`}>
        <Select id={`machine-status-${machine?.id ?? 'new'}`} name="status" defaultValue={machine?.status ?? 'ativo'}>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </Select>
      </Field>
      <input type="hidden" name="provider_key" value="generic" />
      <input type="hidden" name="notes" value="" />

      <div className="col-span-full flex items-center gap-3">
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando...' : machine ? 'Salvar alterações' : 'Cadastrar máquina'}
        </Button>
        {machine && onDone && (
          <button type="button" onClick={onDone} className="text-sm text-neutral-500 hover:underline">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
