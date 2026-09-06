'use client'

import { useActionState, useRef } from 'react'
import { Field, Input, Select, Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { registerStockAdjustment } from './actions'

export function StockAdjustmentForm({ products }: { products: { id: string; name: string; sku: string | null }[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string; success?: boolean } | undefined, formData: FormData) => {
      const result = await registerStockAdjustment(_prev, formData)
      if (result?.success) formRef.current?.reset()
      return result
    },
    undefined,
  )

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <Field label="Produto" htmlFor="product_id">
        <Select id="product_id" name="product_id" required defaultValue="">
          <option value="" disabled>
            Selecione um produto
          </option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
              {p.sku ? ` (${p.sku})` : ''}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Tipo" htmlFor="type">
          <Select id="type" name="type" required defaultValue="entrada">
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
            <option value="ajuste">Ajuste (com sinal, ex: -3)</option>
          </Select>
        </Field>
        <Field label="Quantidade" htmlFor="quantity">
          <Input id="quantity" name="quantity" type="number" required />
        </Field>
      </div>

      <Field label="Motivo" htmlFor="reason">
        <Textarea id="reason" name="reason" rows={2} required />
      </Field>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">Movimentação registrada.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? 'Registrando...' : 'Registrar movimentação'}
      </Button>
    </form>
  )
}
