'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createStockReceipt } from '../actions'
import type { StockReceiptFormState } from '@/lib/validations/stock-receipt'

type ProductVariant = { id: string; color_name: string }
type Product = { id: string; name: string; sku: string | null; variants: ProductVariant[] }

type ItemRow = { product_id: string; variant_id: string; quantity: string; unit_cost: string }

const EMPTY_ROW: ItemRow = { product_id: '', variant_id: '', quantity: '1', unit_cost: '' }

export function StockReceiptForm({ products }: { products: Product[] }) {
  const router = useRouter()
  const [rows, setRows] = useState<ItemRow[]>([{ ...EMPTY_ROW }])

  const [state, formAction, pending] = useActionState(async (_prev: StockReceiptFormState, formData: FormData) => {
    const items = rows
      .filter((r) => r.product_id && Number(r.quantity) > 0)
      .map((r) => ({
        product_id: r.product_id,
        variant_id: r.variant_id || null,
        quantity: Number(r.quantity),
        unit_cost: Number(r.unit_cost || 0),
      }))
    formData.set('items', JSON.stringify(items))
    const result = await createStockReceipt(_prev, formData)
    if (result && 'receiptId' in result && result.receiptId) {
      router.push(`/admin/entradas/${result.receiptId}`)
    }
    return result
  }, undefined)

  function updateRow(index: number, patch: Partial<ItemRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Fornecedor" htmlFor="supplier_name">
          <Input id="supplier_name" name="supplier_name" required />
        </Field>
        <Field label="Nº da nota/documento" htmlFor="document_number" hint="Opcional">
          <Input id="document_number" name="document_number" />
        </Field>
        <Field label="Data do recebimento" htmlFor="received_at">
          <Input id="received_at" name="received_at" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </Field>
      </div>

      <Field label="Observação" htmlFor="notes" hint="Opcional">
        <Textarea id="notes" name="notes" rows={2} />
      </Field>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-900">Itens</h3>
        {rows.map((row, index) => {
          const product = products.find((p) => p.id === row.product_id) ?? null
          return (
            <div key={index} className="grid grid-cols-2 gap-3 rounded-lg border border-neutral-200 p-3 sm:grid-cols-5">
              <Select
                value={row.product_id}
                onChange={(e) => updateRow(index, { product_id: e.target.value, variant_id: '' })}
              >
                <option value="">Selecione o produto</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.sku ? ` (${p.sku})` : ''}
                  </option>
                ))}
              </Select>

              {product && product.variants.length > 0 ? (
                <Select value={row.variant_id} onChange={(e) => updateRow(index, { variant_id: e.target.value })}>
                  <option value="">Selecione a cor</option>
                  {product.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.color_name}
                    </option>
                  ))}
                </Select>
              ) : (
                <div />
              )}

              <Input
                type="number"
                min={1}
                placeholder="Quantidade"
                value={row.quantity}
                onChange={(e) => updateRow(index, { quantity: e.target.value })}
              />
              <Input
                type="number"
                step="0.01"
                min={0}
                placeholder="Custo unitário (R$)"
                value={row.unit_cost}
                onChange={(e) => updateRow(index, { unit_cost: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
                disabled={rows.length === 1}
              >
                Remover
              </Button>
            </div>
          )
        })}
        <Button type="button" variant="secondary" onClick={() => setRows((prev) => [...prev, { ...EMPTY_ROW }])}>
          + Adicionar item
        </Button>
      </div>

      {state && 'error' in state && state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Registrando...' : 'Registrar entrada'}
      </Button>
    </form>
  )
}
