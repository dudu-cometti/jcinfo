'use client'

import { useActionState } from 'react'
import { Field, Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateSiteSettings } from '@/lib/actions/settings'

export function SettingsForm({ whatsappNumber, siteName }: { whatsappNumber: string; siteName: string }) {
  const [state, formAction, pending] = useActionState(updateSiteSettings, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nome do site" htmlFor="site_name">
        <Input id="site_name" name="site_name" required defaultValue={siteName} />
      </Field>
      <Field
        label="Número do WhatsApp"
        htmlFor="whatsapp_number"
        hint="Formato internacional, somente dígitos (ex: 5511999999999). Usado no botão de WhatsApp dos produtos."
      >
        <Input id="whatsapp_number" name="whatsapp_number" defaultValue={whatsappNumber} placeholder="5511999999999" />
      </Field>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">Configurações salvas.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Salvando...' : 'Salvar configurações'}
      </Button>
    </form>
  )
}
