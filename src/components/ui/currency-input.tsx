'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * Digits-as-cents mask (standard BR currency input pattern): the user only
 * ever types digits, which are interpreted as cents from the right.
 *
 * Two usage modes:
 * - Uncontrolled + `name`: for plain <form action={serverAction}> submits.
 *   The visible input has no `name` (never submitted) — the actual form
 *   value comes from a hidden input holding a plain decimal string
 *   ("1999.00"), which the Zod schemas (z.coerce.number()) already expect.
 * - Controlled + `onValueChange`: for client components (e.g. SaleBuilder)
 *   that hold the cart in React state instead of reading FormData.
 */
function centsToDigits(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return ''
  return Math.round(value * 100).toString()
}

function digitsToDisplay(digits: string) {
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function digitsToDecimalString(digits: string) {
  if (!digits) return ''
  const cents = parseInt(digits, 10)
  return (cents / 100).toFixed(2)
}

function digitsToNumber(digits: string) {
  if (!digits) return 0
  return parseInt(digits, 10) / 100
}

export function CurrencyInput({
  id,
  name,
  defaultValue,
  value,
  onValueChange,
  required,
  className,
}: {
  id: string
  name?: string
  defaultValue?: number | null
  value?: number | null
  onValueChange?: (value: number) => void
  required?: boolean
  className?: string
}) {
  const isControlled = value !== undefined
  const [internalDigits, setInternalDigits] = useState(() => centsToDigits(defaultValue ?? null))
  const digits = isControlled ? centsToDigits(value) : internalDigits

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        required={required}
        placeholder="R$ 0,00"
        value={digitsToDisplay(digits)}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
          if (!isControlled) setInternalDigits(raw)
          onValueChange?.(digitsToNumber(raw))
        }}
        className={cn(
          'w-full rounded-lg border border-neutral-300 px-3 py-2 text-base sm:text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none',
          className,
        )}
      />
      {name && <input type="hidden" name={name} value={digitsToDecimalString(digits)} />}
    </>
  )
}
