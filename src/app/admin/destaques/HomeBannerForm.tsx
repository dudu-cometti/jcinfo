'use client'

import { useActionState, useState } from 'react'
import { Field, Input, Textarea, Checkbox, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LinkPicker } from './LinkPicker'
import type { LinkOptionGroup } from '@/lib/data/link-options'
import type { HomeBannerFormState } from '@/lib/validations/home-banner'

type Action = (state: HomeBannerFormState, formData: FormData) => Promise<HomeBannerFormState>

export function HomeBannerForm({
  action,
  linkOptions,
  defaultValues,
  submitLabel,
}: {
  action: Action
  linkOptions: LinkOptionGroup[]
  defaultValues?: {
    title: string
    subtitle: string | null
    cta_label: string | null
    cta_href: string | null
    active: boolean
    show_text_overlay: boolean
  }
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const [showOverlay, setShowOverlay] = useState(defaultValues?.show_text_overlay ?? true)

  return (
    <form action={formAction} className="space-y-4">
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

      <Field label="Título" htmlFor="title" hint={showOverlay ? undefined : 'Usado só como nome interno, não aparece no site'}>
        <Input id="title" name="title" required defaultValue={defaultValues?.title} />
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

      <div>
        <Label htmlFor="cta_href_picker">Link</Label>
        <p className="mb-1 text-xs text-neutral-500">
          {showOverlay ? 'Para onde o botão leva.' : 'Para onde a imagem leva ao ser clicada.'}
        </p>
        <LinkPicker options={linkOptions} defaultValue={defaultValues?.cta_href ?? ''} />
      </div>

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
