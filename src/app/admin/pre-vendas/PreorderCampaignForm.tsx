'use client'

import { useActionState, useState } from 'react'
import { Field, Input, Textarea, Select } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Button } from '@/components/ui/button'
import { slugify } from '@/lib/utils'
import type { PreorderCampaignFormState } from '@/lib/validations/preorder'

type Action = (state: PreorderCampaignFormState, formData: FormData) => Promise<PreorderCampaignFormState>

export function PreorderCampaignForm({
  action,
  rewards,
  defaultValues,
  submitLabel,
}: {
  action: Action
  rewards: { id: string; name: string }[]
  defaultValues?: {
    name: string
    slug: string
    description: string | null
    image_url: string | null
    expected_price: number | null
    expected_date: string | null
    discount_percentage: number | null
    reward_id: string | null
    status: string
  }
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const [slug, setSlug] = useState(defaultValues?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues))

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nome do produto" htmlFor="name" hint="Ex: iPhone 18">
        <Input
          id="name"
          name="name"
          required
          defaultValue={defaultValues?.name}
          onChange={(e) => {
            if (!slugTouched) setSlug(slugify(e.target.value))
          }}
        />
      </Field>

      <Field label="Slug" htmlFor="slug" hint="Usado na URL pública, ex: /pre-venda/iphone-18">
        <Input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(slugify(e.target.value))
          }}
        />
      </Field>

      <Field label="Descrição" htmlFor="description">
        <Textarea id="description" name="description" rows={3} defaultValue={defaultValues?.description ?? ''} />
      </Field>

      <Field label="URL da imagem" htmlFor="image_url">
        <Input id="image_url" name="image_url" type="url" defaultValue={defaultValues?.image_url ?? ''} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Preço previsto" htmlFor="expected_price" hint="Deixe em branco se ainda não souber">
          <CurrencyInput id="expected_price" name="expected_price" defaultValue={defaultValues?.expected_price} />
        </Field>
        <Field label="Data prevista de chegada" htmlFor="expected_date">
          <Input id="expected_date" name="expected_date" type="date" defaultValue={defaultValues?.expected_date ?? ''} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Desconto para quem entrar na pré-venda" htmlFor="discount_percentage" hint="Percentual, deixe em branco se ainda não decidiu">
          <Input
            id="discount_percentage"
            name="discount_percentage"
            type="number"
            min="0"
            max="100"
            step="0.1"
            defaultValue={defaultValues?.discount_percentage ?? ''}
          />
        </Field>
        <Field label="Prêmio para quem entrar na pré-venda" htmlFor="reward_id" hint="Opcional, um dos prêmios já cadastrados">
          <Select id="reward_id" name="reward_id" defaultValue={defaultValues?.reward_id ?? ''}>
            <option value="">Nenhum</option>
            {rewards.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Status" htmlFor="status">
        <Select id="status" name="status" defaultValue={defaultValues?.status ?? 'aberta'}>
          <option value="aberta">Aberta</option>
          <option value="encerrada">Encerrada</option>
          <option value="cancelada">Cancelada</option>
        </Select>
      </Field>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}
