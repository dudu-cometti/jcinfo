'use client'

import { useActionState } from 'react'
import { Field, Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Button } from '@/components/ui/button'
import { createRaffleSignup, type RaffleSignupState } from '@/lib/actions/raffle-entries'

export function RaffleSignupForm({ raffleId }: { raffleId: string }) {
  const action = createRaffleSignup.bind(null, raffleId)
  const [state, formAction, pending] = useActionState<RaffleSignupState, FormData>(action, undefined)

  if (state?.success) {
    return (
      <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="text-sm font-medium text-green-800">
          Inscrição confirmada. Boa sorte no sorteio.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="mt-4 space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-sm font-medium text-neutral-900">Participar deste sorteio</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Nome" htmlFor={`raffle-${raffleId}-name`}>
          <Input id={`raffle-${raffleId}-name`} name="name" required />
        </Field>
        <Field label="Telefone" htmlFor={`raffle-${raffleId}-phone`}>
          <PhoneInput id={`raffle-${raffleId}-phone`} name="phone" required />
        </Field>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Enviando...' : 'Participar do sorteio'}
      </Button>
    </form>
  )
}
