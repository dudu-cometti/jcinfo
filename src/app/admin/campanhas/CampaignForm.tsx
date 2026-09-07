'use client'

import { useActionState } from 'react'
import { Field, Input, Textarea, Select, Checkbox, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { CampaignFormState } from '@/lib/validations/campaign'

type CampaignFormAction = (state: CampaignFormState, formData: FormData) => Promise<CampaignFormState>

function toDatetimeLocal(iso: string) {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function CampaignForm({
  action,
  rewards,
  defaultValues,
  selectedRewardIds = [],
  submitLabel,
}: {
  action: CampaignFormAction
  rewards: { id: string; name: string }[]
  defaultValues?: {
    name: string
    description: string | null
    min_points: number
    start_date: string
    end_date: string
    status: string
    featured: boolean
  }
  selectedRewardIds?: string[]
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
      <Field label="Pontuação mínima" htmlFor="min_points">
        <Input
          id="min_points"
          name="min_points"
          type="number"
          min="1"
          required
          defaultValue={defaultValues?.min_points}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Data inicial" htmlFor="start_date">
          <Input
            id="start_date"
            name="start_date"
            type="datetime-local"
            required
            defaultValue={defaultValues ? toDatetimeLocal(defaultValues.start_date) : undefined}
          />
        </Field>
        <Field label="Data final" htmlFor="end_date">
          <Input
            id="end_date"
            name="end_date"
            type="datetime-local"
            required
            defaultValue={defaultValues ? toDatetimeLocal(defaultValues.end_date) : undefined}
          />
        </Field>
      </div>

      <div>
        <Label>Prêmios desta campanha</Label>
        <div className="space-y-1 rounded-lg border border-neutral-200 p-3">
          {rewards.length === 0 ? (
            <p className="text-sm text-neutral-400">Nenhum prêmio cadastrado ainda.</p>
          ) : (
            rewards.map((reward) => (
              <label key={reward.id} className="flex items-center gap-2 text-sm text-neutral-700">
                <Checkbox name="reward_ids" value={reward.id} defaultChecked={selectedRewardIds.includes(reward.id)} />
                {reward.name}
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={defaultValues?.status ?? 'rascunho'}>
            <option value="rascunho">Rascunho</option>
            <option value="ativa">Ativa</option>
            <option value="encerrada">Encerrada</option>
          </Select>
        </Field>
        <div className="flex items-center gap-2 pt-6">
          <Checkbox id="featured" name="featured" defaultChecked={defaultValues?.featured} />
          <Label htmlFor="featured" className="mb-0">
            Destaque na página inicial
          </Label>
        </div>
      </div>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}
