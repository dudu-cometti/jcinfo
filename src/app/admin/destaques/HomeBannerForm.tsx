'use client'

import { useActionState, useState } from 'react'
import { Field, Input, Textarea, Checkbox, Label, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LinkPicker } from './LinkPicker'
import type { LinkOptionGroup } from '@/lib/data/link-options'
import type { HomeBannerFormState } from '@/lib/validations/home-banner'

type Action = (state: HomeBannerFormState, formData: FormData) => Promise<HomeBannerFormState>

type PreorderCampaignOption = { id: string; name: string; status: string }

export function HomeBannerForm({
  action,
  linkOptions,
  preorderCampaigns,
  defaultValues,
  submitLabel,
}: {
  action: Action
  linkOptions: LinkOptionGroup[]
  preorderCampaigns: PreorderCampaignOption[]
  defaultValues?: {
    title: string
    subtitle: string | null
    cta_label: string | null
    cta_href: string | null
    active: boolean
    show_text_overlay: boolean
    preorder_campaign_id: string | null
  }
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const [showOverlay, setShowOverlay] = useState(defaultValues?.show_text_overlay ?? true)
  const [linkedCampaignId, setLinkedCampaignId] = useState(defaultValues?.preorder_campaign_id ?? '')
  const [title, setTitle] = useState(defaultValues?.title ?? '')
  const isLinked = Boolean(linkedCampaignId)

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Vincular a uma pré-venda" htmlFor="preorder_campaign_id" hint="Opcional. Escolhendo uma, a imagem e o link são os mesmos já cadastrados na pré-venda.">
        <Select
          id="preorder_campaign_id"
          name="preorder_campaign_id"
          value={linkedCampaignId}
          onChange={(e) => {
            setLinkedCampaignId(e.target.value)
            const campaign = preorderCampaigns.find((c) => c.id === e.target.value)
            if (campaign && !title) setTitle(campaign.name)
          }}
        >
          <option value="">Nenhuma (imagem própria)</option>
          {preorderCampaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.status === 'aberta' ? c.name : `${c.name} (${c.status})`}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex items-center gap-2">
        <Checkbox
          id="show_text_overlay"
          name="show_text_overlay"
          checked={showOverlay}
          onChange={(e) => setShowOverlay(e.target.checked)}
        />
        <Label htmlFor="show_text_overlay" className="mb-0">
          Escrever título e botão por cima da imagem
        </Label>
      </div>
      <p className="-mt-2 text-xs text-neutral-500">
        {showOverlay
          ? 'Use para uma foto simples, sem texto desenhado nela. O sistema escurece a imagem e escreve por cima.'
          : 'Use quando a imagem já é um banner pronto, com texto e botão desenhados nela. A imagem aparece limpa, sem nada por cima, e o link abaixo faz a imagem inteira ser clicável.'}
      </p>

      <Field label="Título" htmlFor="title" hint={!showOverlay ? 'Usado só como nome interno, não aparece no site' : undefined}>
        <Input id="title" name="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      {showOverlay && (
        <>
          <Field label="Subtítulo" htmlFor="subtitle">
            <Textarea id="subtitle" name="subtitle" rows={2} defaultValue={defaultValues?.subtitle ?? ''} />
          </Field>
          <Field label="Texto do botão" htmlFor="cta_label">
            <Input id="cta_label" name="cta_label" defaultValue={defaultValues?.cta_label ?? ''} />
          </Field>
        </>
      )}

      {isLinked ? (
        <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-500">
          Imagem e link definidos automaticamente pela pré-venda selecionada acima.
        </p>
      ) : (
        <div>
          <Label htmlFor="cta_href_picker">Link</Label>
          <p className="mb-1 text-xs text-neutral-500">
            {showOverlay ? 'Para onde o botão leva.' : 'Para onde a imagem leva ao ser clicada.'}
          </p>
          <LinkPicker options={linkOptions} defaultValue={defaultValues?.cta_href ?? ''} />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Checkbox id="active" name="active" defaultChecked={defaultValues?.active ?? true} />
        <Label htmlFor="active" className="mb-0">
          Ativo (aparece no carrossel da home)
        </Label>
      </div>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}
