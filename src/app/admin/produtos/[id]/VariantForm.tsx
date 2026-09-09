'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Field, Input, Select } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Button } from '@/components/ui/button'
import type { ProductVariantFormState } from '@/lib/validations/product-variant'

type VariantAction = (state: ProductVariantFormState, formData: FormData) => Promise<ProductVariantFormState>

type VariantDefaults = {
  color_name: string
  color_hex: string | null
  price: number
  promo_price: number | null
  stock: number
  sku: string | null
  status: 'ativo' | 'inativo'
}

export function VariantForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: VariantAction
  defaultValues?: VariantDefaults
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Cor" htmlFor="color_name">
          <Input id="color_name" name="color_name" required defaultValue={defaultValues?.color_name} />
        </Field>
        <Field label="Cor (código, opcional)" htmlFor="color_hex" hint="Ex: #1d1d1f, pra mostrar uma amostra da cor">
          <Input id="color_hex" name="color_hex" placeholder="#000000" defaultValue={defaultValues?.color_hex ?? ''} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Preço" htmlFor="price">
          <CurrencyInput id="price" name="price" required defaultValue={defaultValues?.price} />
        </Field>
        <Field label="Preço promocional" htmlFor="promo_price" hint="Deixe em branco se não houver promoção">
          <CurrencyInput id="promo_price" name="promo_price" defaultValue={defaultValues?.promo_price} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="SKU" htmlFor="sku">
          <Input id="sku" name="sku" defaultValue={defaultValues?.sku ?? ''} />
        </Field>
      </div>

      {defaultValues && (
        <p className="rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
          Estoque atual: <span className="font-medium text-neutral-900">{defaultValues.stock}</span>
          {' — '}
          <Link href="/admin/entradas/nova" className="text-brand-navy hover:underline">
            registrar entrada de estoque
          </Link>
          {' '}para alterar. Não é editável aqui.
        </p>
      )}

      <Field label="Status" htmlFor="status">
        <Select id="status" name="status" defaultValue={defaultValues?.status ?? 'ativo'}>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </Select>
      </Field>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}
