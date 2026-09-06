'use client'

import { useActionState } from 'react'
import { Field, Input, Textarea, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { RaffleFormState } from '@/lib/validations/raffle'

type RaffleFormAction = (state: RaffleFormState, formData: FormData) => Promise<RaffleFormState>

function toDatetimeLocal(iso: string) {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function RaffleForm({
  action,
  rewards,
  campaigns,
  defaultValues,
  submitLabel,
}: {
  action: RaffleFormAction
  rewards: { id: string; name: string }[]
  campaigns: { id: string; name: string }[]
  defaultValues?: {
    name: string
    description: string | null
    reward_id: string | null
    campaign_id: string | null
    raffle_date: string
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
      <Field label="Prêmio" htmlFor="reward_id">
        <Select id="reward_id" name="reward_id" defaultValue={defaultValues?.reward_id ?? ''}>
          <option value="">Nenhum</option>
          {rewards.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Campanha relacionada" htmlFor="campaign_id">
        <Select id="campaign_id" name="campaign_id" defaultValue={defaultValues?.campaign_id ?? ''}>
          <option value="">Nenhuma</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Data do sorteio" htmlFor="raffle_date">
        <Input
          id="raffle_date"
          name="raffle_date"
          type="datetime-local"
          required
          defaultValue={defaultValues ? toDatetimeLocal(defaultValues.raffle_date) : undefined}
        />
      </Field>
      <Field label="Status" htmlFor="status">
        <Select id="status" name="status" defaultValue={defaultValues?.status ?? 'aberto'}>
          <option value="aberto">Aberto</option>
          <option value="encerrado">Encerrado</option>
          <option value="cancelado">Cancelado</option>
        </Select>
      </Field>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}
