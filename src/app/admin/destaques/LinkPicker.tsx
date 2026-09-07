'use client'

import { useState } from 'react'
import { Select, Input } from '@/components/ui/input'
import type { LinkOptionGroup } from '@/lib/data/link-options'

const CUSTOM_VALUE = '__custom__'

export function LinkPicker({
  options,
  defaultValue,
}: {
  options: LinkOptionGroup[]
  defaultValue: string
}) {
  const allValues = options.flatMap((g) => g.items.map((i) => i.value))
  const matchesKnownOption = defaultValue === '' || allValues.includes(defaultValue)

  const [mode, setMode] = useState<'select' | 'custom'>(matchesKnownOption ? 'select' : 'custom')
  const [value, setValue] = useState(defaultValue)

  return (
    <div className="space-y-2">
      <Select
        value={mode === 'custom' ? CUSTOM_VALUE : value}
        onChange={(e) => {
          if (e.target.value === CUSTOM_VALUE) {
            setMode('custom')
            setValue('')
          } else {
            setMode('select')
            setValue(e.target.value)
          }
        }}
      >
        <option value="">Nenhum</option>
        {options.map((group) => (
          <optgroup key={group.group} label={group.group}>
            {group.items.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </optgroup>
        ))}
        <option value={CUSTOM_VALUE}>Personalizado...</option>
      </Select>

      {mode === 'custom' && (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="/caminho-personalizado"
        />
      )}

      <input type="hidden" name="cta_href" value={value} />
    </div>
  )
}
