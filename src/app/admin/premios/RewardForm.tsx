'use client'

import { useActionState } from 'react'
import { Field, Input, Textarea, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { RewardFormState } from '@/lib/validations/reward'

type RewardFormAction = (state: RewardFormState, formData: FormData) => Promise<RewardFormState>

export function RewardForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: RewardFormAction
  defaultValues?: {
    name: string
    description: string | null
    image_url: string | null
    quantity: number
    points_required: number
    status: string
  }
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nome" htmlFor="name">
        <Input id="name" name="name" required defaultValue={defaultValues?.name} />
      </Field>
      <Field label="Descrição" htmlFor="description">
        <Textarea id="description" name="description" rows={3} defaultValue={defaultValues?.description ?? ''} />
      </Field>
      <Field label="URL da imagem" htmlFor="image_url">
        <Input id="image_url" name="image_url" type="url" defaultValue={defaultValues?.image_url ?? ''} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Quantidade disponível" htmlFor="quantity">
          <Input id="quantity" name="quantity" type="number" min="0" required defaultValue={defaultValues?.quantity ?? 0} />
        </Field>
        <Field label="Pontos necessários" htmlFor="points_required">
          <Input
            id="points_required"
            name="points_required"
            type="number"
            min="1"
            required
            defaultValue={defaultValues?.points_required}
          />
        </Field>
      </div>
      <Field label="Status" htmlFor="status">
        <Select id="status" name="status" defaultValue={defaultValues?.status ?? 'ativo'}>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </Select>
      </Field>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}
