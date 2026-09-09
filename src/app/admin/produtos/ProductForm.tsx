'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { Field, Input, Textarea, Select, Checkbox, Label } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Button } from '@/components/ui/button'
import { slugify } from '@/lib/utils'
import type { ProductFormState } from '@/lib/validations/product'

type ProductFormAction = (state: ProductFormState, formData: FormData) => Promise<ProductFormState>

type ProductDefaults = {
  name: string
  slug: string
  description: string | null
  category_id: string | null
  brand_id: string | null
  model: string | null
  price: number
  promo_price: number | null
  cost: number | null
  stock: number
  min_stock: number
  sku: string | null
  internal_code: string | null
  status: 'ativo' | 'inativo'
  featured: boolean
  condition: 'novo' | 'seminovo'
}

export function ProductForm({
  action,
  categories,
  brands,
  defaultValues,
  hasVariants = false,
  submitLabel,
}: {
  action: ProductFormAction
  categories: { id: string; name: string }[]
  brands: { id: string; name: string }[]
  defaultValues?: ProductDefaults
  hasVariants?: boolean
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, undefined)
  const [slug, setSlug] = useState(defaultValues?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues))
  const [condition, setCondition] = useState(defaultValues?.condition ?? 'seminovo')
  const pricingLocked = condition === 'novo' && hasVariants

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nome" htmlFor="name">
          <Input
            id="name"
            name="name"
            required
            defaultValue={defaultValues?.name}
            onChange={(e) => {
              if (!slugTouched) setSlug(slugify(e.target.value))
            }}
          />
        </Field>

        <Field label="Slug" htmlFor="slug" hint="Usado na URL pública do produto">
          <Input
            id="slug"
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(slugify(e.target.value))
            }}
          />
        </Field>
      </div>

      <Field label="Descrição" htmlFor="description">
        <Textarea id="description" name="description" rows={4} defaultValue={defaultValues?.description ?? ''} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Categoria" htmlFor="category_id">
          <Select id="category_id" name="category_id" defaultValue={defaultValues?.category_id ?? ''}>
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Marca" htmlFor="brand_id">
          <Select id="brand_id" name="brand_id" defaultValue={defaultValues?.brand_id ?? ''}>
            <option value="">Sem marca</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Modelo" htmlFor="model">
          <Input id="model" name="model" defaultValue={defaultValues?.model ?? ''} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Condição"
          htmlFor="condition"
          hint={
            condition === 'novo'
              ? 'Produto novo pode ter várias cores, cada uma com seu próprio estoque e preço.'
              : 'Aparelho único: uma cor, um estoque. Ex: seminovo ou item avulso.'
          }
        >
          <Select id="condition" name="condition" value={condition} onChange={(e) => setCondition(e.target.value as 'novo' | 'seminovo')}>
            <option value="seminovo">Seminovo</option>
            <option value="novo">Novo</option>
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field
          label="Preço"
          htmlFor="price"
          hint={pricingLocked ? 'Controlado pelas cores cadastradas abaixo.' : undefined}
        >
          <CurrencyInput
            id="price"
            name="price"
            required
            defaultValue={defaultValues?.price}
            className={pricingLocked ? 'bg-neutral-50 text-neutral-400' : undefined}
          />
        </Field>
        <Field label="Preço promocional" htmlFor="promo_price" hint={pricingLocked ? 'Controlado pelas cores cadastradas abaixo.' : 'Deixe em branco se não houver promoção'}>
          <CurrencyInput
            id="promo_price"
            name="promo_price"
            defaultValue={defaultValues?.promo_price}
            className={pricingLocked ? 'bg-neutral-50 text-neutral-400' : undefined}
          />
        </Field>
        <Field label="Custo" htmlFor="cost" hint="Uso interno. Só o admin vê isso, não aparece na loja nem para vendedores">
          <CurrencyInput id="cost" name="cost" defaultValue={defaultValues?.cost} />
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Estoque mínimo" htmlFor="min_stock">
          <Input id="min_stock" name="min_stock" type="number" min="0" required defaultValue={defaultValues?.min_stock ?? 0} />
        </Field>
        <Field label="SKU" htmlFor="sku">
          <Input id="sku" name="sku" defaultValue={defaultValues?.sku ?? ''} />
        </Field>
        <Field label="Código interno" htmlFor="internal_code">
          <Input id="internal_code" name="internal_code" defaultValue={defaultValues?.internal_code ?? ''} />
        </Field>
      </div>

      <div className="flex items-center gap-6">
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={defaultValues?.status ?? 'ativo'}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </Select>
        </Field>

        <div className="flex items-center gap-2 pt-6">
          <Checkbox id="featured" name="featured" defaultChecked={defaultValues?.featured} />
          <Label htmlFor="featured" className="mb-0">
            Produto em destaque
          </Label>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Salvando...' : submitLabel}
      </Button>
    </form>
  )
}
