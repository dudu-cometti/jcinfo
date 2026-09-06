'use client'

import { useActionState } from 'react'
import { Field, Input, Textarea, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { CommissionRuleFormState } from '@/lib/validations/commission-rule'

type Action = (state: CommissionRuleFormState, formData: FormData) => Promise<CommissionRuleFormState>

export function CommissionRuleForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: Action
  defaultValues?: {
    name: string
    percentage: number | null
    fixed_value: number | null
    description: string | null
    period_start: string | null
    period_end: string | null
    status: string
  }
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nome da regra" htmlFor="name">
        <Input id="name" name="name" required defaultValue={defaultValues?.name} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Percentual (%)" htmlFor="percentage">
          <Input id="percentage" name="percentage" type="number" step="0.01" min="0" max="100" defaultValue={defaultValues?.percentage ?? ''} />
        </Field>
        <Field label="Valor fixo (R$)" htmlFor="fixed_value">
          <Input id="fixed_value" name="fixed_value" type="number" step="0.01" min="0" defaultValue={defaultValues?.fixed_value ?? ''} />
        </Field>
      </div>
      <Field label="Descrição" htmlFor="description">
        <Textarea id="description" name="description" rows={2} defaultValue={defaultValues?.description ?? ''} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Início da vigência" htmlFor="period_start">
          <Input id="period_start" name="period_start" type="date" defaultValue={defaultValues?.period_start ?? ''} />
        </Field>
        <Field label="Fim da vigência" htmlFor="period_end">
          <Input id="period_end" name="period_end" type="date" defaultValue={defaultValues?.period_end ?? ''} />
        </Field>
      </div>
      <Field label="Status" htmlFor="status">
        <Select id="status" name="status" defaultValue={defaultValues?.status ?? 'ativa'}>
          <option value="ativa">Ativa</option>
          <option value="inativa">Inativa</option>
        </Select>
      </Field>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}
