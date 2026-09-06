'use client'

import { useState } from 'react'
import { Input } from './input'

function formatPhoneBR(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function PhoneInput({
  id,
  name,
  defaultValue,
  required,
  autoFocus,
  value,
  onChange,
}: {
  id: string
  name?: string
  defaultValue?: string
  required?: boolean
  autoFocus?: boolean
  value?: string
  onChange?: (formatted: string) => void
}) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState(() => formatPhoneBR(defaultValue ?? ''))
  const displayValue = isControlled ? formatPhoneBR(value) : internalValue

  return (
    <Input
      id={id}
      name={name}
      required={required}
      autoFocus={autoFocus}
      placeholder="(11) 99999-9999"
      value={displayValue}
      onChange={(e) => {
        const formatted = formatPhoneBR(e.target.value)
        if (!isControlled) setInternalValue(formatted)
        onChange?.(formatted)
      }}
    />
  )
}
