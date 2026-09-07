'use client'

import { useActionState } from 'react'
import { Field, Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Button } from '@/components/ui/button'
import { createPreorderSignup } from '@/lib/actions/preorder-signups'
import type { PreorderSignupState } from '@/lib/actions/preorder-signups'

export function PreorderSignupForm({ campaignId, dark }: { campaignId: string; dark?: boolean }) {
  const action = createPreorderSignup.bind(null, campaignId)
  const [state, formAction, pending] = useActionState<PreorderSignupState, FormData>(action, undefined)

  if (state?.success) {
    return (
      <div className={`rounded-2xl border p-5 ${dark ? 'border-white/20 bg-white/10' : 'border-green-200 bg-green-50'}`}>
        <p className={`text-sm font-medium ${dark ? 'text-white' : 'text-green-800'}`}>
          Você está na lista. Assim que abrirmos as vendas, entramos em contato pelo telefone informado.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nome" htmlFor="preorder-name">
          <Input id="preorder-name" name="name" required />
        </Field>
        <Field label="Telefone" htmlFor="preorder-phone">
          <PhoneInput id="preorder-phone" name="phone" required />
        </Field>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending} className="w-full bg-brand-cyan text-brand-navy hover:brightness-95 sm:w-auto">
        {pending ? 'Enviando...' : 'Entrar na lista de pré-venda'}
      </Button>
    </form>
  )
}
