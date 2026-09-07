'use client'

import { useState } from 'react'
import { Input } from './input'

function formatCpf(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

export function CpfInput({
  id,
  name,
  required,
  value,
  onChange,
}: {
  id: string
  name?: string
  required?: boolean
  value?: string
  onChange?: (formatted: string) => void
}) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = useState('')
  const displayValue = isControlled ? formatCpf(value) : internalValue

  return (
    <Input
      id={id}
      name={name}
      required={required}
      placeholder="000.000.000-00"
      inputMode="numeric"
      value={displayValue}
      onChange={(e) => {
        const formatted = formatCpf(e.target.value)
        if (!isControlled) setInternalValue(formatted)
        onChange?.(formatted)
      }}
    />
  )
}
