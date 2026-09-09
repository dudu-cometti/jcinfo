'use client'

import { useActionState } from 'react'
import { Field, Input, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { updateSiteSettings } from '@/lib/actions/settings'
import type { SiteSettings } from '@/lib/data/settings'

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [state, formAction, pending] = useActionState(updateSiteSettings, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nome do site" htmlFor="site_name">
        <Input id="site_name" name="site_name" required defaultValue={settings.site_name} />
      </Field>
      <Field
        label="Número do WhatsApp"
        htmlFor="whatsapp_number"
        hint="Formato internacional, somente dígitos (ex: 5511999999999). Usado no botão de WhatsApp dos produtos."
      >
        <Input
          id="whatsapp_number"
          name="whatsapp_number"
          defaultValue={settings.whatsapp_number}
          placeholder="5511999999999"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Frete padrão (R$)" htmlFor="freight_default_value" hint="Usado como sugestão em novos orçamentos.">
          <Input
            id="freight_default_value"
            name="freight_default_value"
            type="number"
            step="0.01"
            min="0"
            defaultValue={settings.freight_default_value}
          />
        </Field>
        <Field
          label="Limite máximo de frete (R$)"
          htmlFor="freight_max_value"
          hint="O vendedor não pode informar um frete acima deste valor."
        >
          <Input
            id="freight_max_value"
            name="freight_max_value"
            type="number"
            step="0.01"
            min="0"
            defaultValue={settings.freight_max_value}
          />
        </Field>
      </div>

      <Field
        label="Validade padrão do orçamento (dias)"
        htmlFor="orcamento_default_validity_days"
      >
        <Input
          id="orcamento_default_validity_days"
          name="orcamento_default_validity_days"
          type="number"
          step="1"
          min="1"
          defaultValue={settings.orcamento_default_validity_days}
        />
      </Field>

      <Field
        label="Texto de garantia"
        htmlFor="store_warranty_text"
        hint="Exibido na imagem de orçamento enviada ao cliente."
      >
        <Textarea id="store_warranty_text" name="store_warranty_text" rows={2} defaultValue={settings.store_warranty_text} />
      </Field>

      <Field label="Endereço da loja" htmlFor="store_address" hint="Exibido na imagem de orçamento enviada ao cliente.">
        <Textarea id="store_address" name="store_address" rows={2} defaultValue={settings.store_address} />
      </Field>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">Configurações salvas.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Salvando...' : 'Salvar configurações'}
      </Button>
    </form>
  )
}
