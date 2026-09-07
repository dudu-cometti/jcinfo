'use client'

import { useActionState } from 'react'
import { Field, Input, Textarea, Checkbox, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { HomeBannerFormState } from '@/lib/validations/home-banner'

type Action = (state: HomeBannerFormState, formData: FormData) => Promise<HomeBannerFormState>

export function HomeBannerForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: Action
  defaultValues?: {
    title: string
    subtitle: string | null
    cta_label: string | null
    cta_href: string | null
    image_url: string | null
    active: boolean
  }
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Título" htmlFor="title">
        <Input id="title" name="title" required defaultValue={defaultValues?.title} />
      </Field>
      <Field label="Subtítulo" htmlFor="subtitle">
        <Textarea id="subtitle" name="subtitle" rows={2} defaultValue={defaultValues?.subtitle ?? ''} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Texto do botão" htmlFor="cta_label">
          <Input id="cta_label" name="cta_label" defaultValue={defaultValues?.cta_label ?? ''} />
        </Field>
        <Field
          label="Link do botão"
          htmlFor="cta_href"
          hint="Ex: /produtos, /pre-venda/iphone-18, /campanhas"
        >
          <Input id="cta_href" name="cta_href" defaultValue={defaultValues?.cta_href ?? ''} />
        </Field>
      </div>
      <Field
        label="Imagem de fundo"
        htmlFor="image_url"
        hint="Opcional (sem imagem, usa o degradê padrão da marca). Use uma foto retangular (formato paisagem), no mínimo 1600x900px, com o assunto principal centralizado — o sistema preenche o banner cortando as bordas conforme a tela (mais das laterais no celular, mais de cima/baixo no computador)"
      >
        <Input id="image_url" name="image_url" type="url" defaultValue={defaultValues?.image_url ?? ''} />
      </Field>

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
