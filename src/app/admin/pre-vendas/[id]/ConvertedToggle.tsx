'use client'

import { useTransition } from 'react'
import { toggleSignupConverted } from '../actions'

export function ConvertedToggle({ signupId, converted }: { signupId: string; converted: boolean }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => toggleSignupConverted(signupId, !converted))}
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
        converted ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
      }`}
    >
      {converted ? 'Convertido' : 'Marcar como convertido'}
    </button>
  )
}
