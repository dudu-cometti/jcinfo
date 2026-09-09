'use client'

import { useActionState } from 'react'
import { Field, Input, Select, Checkbox, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createRateRule, updateRateRule } from './actions'

const METHOD_LABELS: Record<string, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  debito: 'Débito',
  credito: 'Crédito',
}

type Rule = {
  id: string
  method: string
  installments: number
  card_brand: string | null
  percentage: number
  fixed_value: number | null
  settlement_days?: number | null
  infinite_nitro?: boolean
  fee_passed_to_customer?: boolean
  period_start: string | null
  period_end: string | null
}

export function RateRuleForm({ machineId, rule, onDone }: { machineId: string; rule?: Rule; onDone?: () => void }) {
  const action = rule ? updateRateRule.bind(null, rule.id) : createRateRule
  const key = rule?.id ?? machineId
  const [state, formAction, pending] = useActionState(async (prev: Parameters<typeof action>[0], formData: FormData) => {
    const result = await action(prev, formData)
    if (result?.success) onDone?.()
    return result
  }, undefined)

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <input type="hidden" name="machine_id" value={machineId} />

      <Field label="Forma" htmlFor={`method-${key}`}>
        <Select id={`method-${key}`} name="method" defaultValue={rule?.method ?? 'credito'} required>
          {Object.entries(METHOD_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Parcelas" htmlFor={`installments-${key}`} hint="1 para pix/débito/crédito à vista">
        <Input id={`installments-${key}`} name="installments" type="number" min={1} max={18} defaultValue={rule?.installments ?? 1} required />
      </Field>

      <Field label="Bandeira" htmlFor={`card_brand-${key}`} hint="Vazio = qualquer bandeira">
        <Input id={`card_brand-${key}`} name="card_brand" placeholder="Visa, Master..." defaultValue={rule?.card_brand ?? ''} />
      </Field>

      <Field label="Taxa (%)" htmlFor={`percentage-${key}`}>
        <Input id={`percentage-${key}`} name="percentage" type="number" step="0.01" min={0} max={100} defaultValue={rule?.percentage} required />
      </Field>

      <Field label="Taxa fixa (R$)" htmlFor={`fixed_value-${key}`} hint="Opcional">
        <Input id={`fixed_value-${key}`} name="fixed_value" type="number" step="0.01" min={0} defaultValue={rule?.fixed_value ?? ''} />
      </Field>

      <Field label="Prazo recebimento (dias)" htmlFor={`settlement_days-${key}`} hint="Informativo">
        <Input id={`settlement_days-${key}`} name="settlement_days" type="number" min={0} defaultValue={rule?.settlement_days ?? ''} />
      </Field>

      <Field label="Vigência início" htmlFor={`period_start-${key}`}>
        <Input id={`period_start-${key}`} name="period_start" type="date" defaultValue={rule?.period_start ?? ''} />
      </Field>

      <Field label="Vigência fim" htmlFor={`period_end-${key}`}>
        <Input id={`period_end-${key}`} name="period_end" type="date" defaultValue={rule?.period_end ?? ''} />
      </Field>

      <input type="hidden" name="channel" value="maquininha" />
      <input type="hidden" name="revenue_tier" value="" />
      <input type="hidden" name="status" value="ativa" />

      <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
        <Checkbox id={`infinite_nitro-${key}`} name="infinite_nitro" defaultChecked={rule?.infinite_nitro} />
        <Label htmlFor={`infinite_nitro-${key}`} className="mb-0">
          InfiniteNitro
        </Label>
      </div>

      <div className="col-span-2 flex items-center gap-2 sm:col-span-1">
        <Checkbox id={`fee_passed-${key}`} name="fee_passed_to_customer" defaultChecked={rule?.fee_passed_to_customer ?? true} />
        <Label htmlFor={`fee_passed-${key}`} className="mb-0">
          Taxa repassada ao cliente
        </Label>
      </div>

      <div className="col-span-full flex items-center gap-3">
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando...' : rule ? 'Salvar alterações' : 'Adicionar taxa'}
        </Button>
        {rule && onDone && (
          <button type="button" onClick={onDone} className="text-sm text-neutral-500 hover:underline">
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
