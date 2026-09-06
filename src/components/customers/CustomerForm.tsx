'use client'

import { useActionState } from 'react'
import { Field, Input, Textarea } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Button } from '@/components/ui/button'
import type { CustomerFormState } from '@/lib/validations/customer'

type CustomerFormAction = (state: CustomerFormState, formData: FormData) => Promise<CustomerFormState>

export function CustomerForm({
  action,
  defaultValues,
  submitLabel,
  onSuccess,
}: {
  action: CustomerFormAction
  defaultValues?: { name: string; phone: string; email: string | null; notes: string | null }
  submitLabel: string
  onSuccess?: (customerId: string) => void
}) {
  const [state, formAction, pending] = useActionState(async (prev: CustomerFormState, formData: FormData) => {
    const result = await action(prev, formData)
    if (result?.customerId && !result.error) onSuccess?.(result.customerId)
    return result
  }, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <Field label="Nome" htmlFor="name">
        <Input id="name" name="name" required defaultValue={defaultValues?.name} />
      </Field>
      <Field label="Telefone" htmlFor="phone" hint="Usado para identificar o cliente e evitar duplicidade">
        <PhoneInput id="phone" name="phone" required defaultValue={defaultValues?.phone} />
      </Field>
      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" defaultValue={defaultValues?.email ?? ''} />
      </Field>
      <Field label="Observações" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={3} defaultValue={defaultValues?.notes ?? ''} />
      </Field>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}
