'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Textarea, Label, Select, Field } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatBRL } from '@/lib/utils'
import { createOrcamento, updateOrcamento } from '@/lib/actions/orcamentos'
import { previewOrcamentoFees, type PreviewFeesState } from '@/lib/actions/orcamento-fees'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { createCustomer } from '@/lib/actions/customers'
import type { PaymentMethod } from '@/lib/payments/fees'

type Customer = { id: string; name: string; phone: string; points: number }
type Variant = { id: string; color_name: string; price: number; promo_price: number | null; stock: number }
type Product = {
  id: string
  name: string
  sku: string | null
  price: number
  promo_price: number | null
  stock: number
  variants: Variant[]
}
type CartLine = { product: Product; variant: Variant | null; quantity: number }
type Machine = { id: string; name: string; min_installments: number; max_installments: number }

export type EditOrcamentoData = {
  orcamentoId: string
  customerName: string
  initialCart: CartLine[]
  discount: number
  freightValue: number
  machineId: string
  method: PaymentMethod
  cardBrand: string
  installments: number
  validityDays: number
  notes: string
}

function lineKey(productId: string, variantId: string | null) {
  return `${productId}:${variantId ?? ''}`
}

function useDebouncedSearch<T>(query: string, url: (q: string) => string, key: string) {
  const [results, setResults] = useState<T[]>([])
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim().length < 2) {
        setResults([])
        return
      }
      fetch(url(query))
        .then((r) => r.json())
        .then((data) => setResults(data[key] ?? []))
        .catch(() => setResults([]))
    }, 250)
    return () => clearTimeout(timeout)
  }, [query, url, key])
  return results
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  debito: 'Débito',
  credito: 'Crédito',
}

export function OrcamentoBuilder({
  machines,
  defaultFreight,
  maxFreight,
  defaultValidityDays,
  editOrcamento,
}: {
  machines: Machine[]
  defaultFreight: number
  maxFreight: number
  defaultValidityDays: number
  /** When set, the builder edits an existing rascunho instead of creating a new orçamento — the customer is fixed and cannot be changed. */
  editOrcamento?: EditOrcamentoData
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [customerQuery, setCustomerQuery] = useState('')
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const customerResults = useDebouncedSearch<Customer>(
    customerQuery,
    (q) => `/api/customers/search?q=${encodeURIComponent(q)}`,
    'customers',
  )

  const [productQuery, setProductQuery] = useState('')
  const productResults = useDebouncedSearch<Product>(
    productQuery,
    (q) => `/api/products/search?q=${encodeURIComponent(q)}`,
    'products',
  )
  const [colorPickerProduct, setColorPickerProduct] = useState<Product | null>(null)
  const [cart, setCart] = useState<CartLine[]>(editOrcamento?.initialCart ?? [])
  const [discount, setDiscount] = useState(editOrcamento?.discount ?? 0)
  const [freight, setFreight] = useState(editOrcamento?.freightValue ?? defaultFreight)
  const [notes, setNotes] = useState(editOrcamento?.notes ?? '')
  const [validityDays, setValidityDays] = useState(editOrcamento?.validityDays ?? defaultValidityDays)

  const [machineId, setMachineId] = useState(editOrcamento?.machineId ?? machines[0]?.id ?? '')
  const [method, setMethod] = useState<PaymentMethod>(editOrcamento?.method ?? 'pix')
  const [cardBrand, setCardBrand] = useState(editOrcamento?.cardBrand ?? '')
  const [installments, setInstallments] = useState(editOrcamento?.installments ?? 1)
  const [fees, setFees] = useState<PreviewFeesState | null>(null)
  const [calculating, setCalculating] = useState(false)

  const machine = machines.find((m) => m.id === machineId) ?? null

  const subtotal = cart.reduce((sum, line) => {
    const price = line.variant?.promo_price ?? line.variant?.price ?? line.product.promo_price ?? line.product.price
    return sum + price * line.quantity
  }, 0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!machineId || subtotal <= 0) {
        setFees(null)
        return
      }
      setCalculating(true)
      previewOrcamentoFees({
        subtotal,
        discount,
        freight,
        machineId,
        method,
        installments,
        cardBrand: cardBrand || null,
      })
        .then(setFees)
        .finally(() => setCalculating(false))
    }, 300)
    return () => clearTimeout(timeout)
  }, [subtotal, discount, freight, machineId, method, installments, cardBrand])

  function addToCart(product: Product, variant: Variant | null) {
    setCart((prev) => {
      const key = lineKey(product.id, variant?.id ?? null)
      const existing = prev.find((line) => lineKey(line.product.id, line.variant?.id ?? null) === key)
      if (existing) {
        return prev.map((line) =>
          lineKey(line.product.id, line.variant?.id ?? null) === key
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        )
      }
      return [...prev, { product, variant, quantity: 1 }]
    })
    setProductQuery('')
    setColorPickerProduct(null)
  }

  function handleProductClick(product: Product) {
    if (product.variants.length > 0) {
      setColorPickerProduct(product)
    } else {
      addToCart(product, null)
    }
  }

  function updateQuantity(key: string, quantity: number) {
    setCart((prev) =>
      prev.map((line) => (lineKey(line.product.id, line.variant?.id ?? null) === key ? { ...line, quantity: Math.max(1, quantity) } : line)),
    )
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((line) => lineKey(line.product.id, line.variant?.id ?? null) !== key))
  }

  function handleSubmit() {
    setError(null)
    if (!editOrcamento && !customer) return setError('Selecione um cliente.')
    if (cart.length === 0) return setError('Adicione ao menos um produto.')
    if (!machineId) return setError('Selecione a máquina.')
    if (fees && 'error' in fees) return setError(fees.error)

    startTransition(async () => {
      const formData = new FormData()
      if (customer) formData.set('customer_id', customer.id)
      formData.set(
        'items',
        JSON.stringify(cart.map((line) => ({ product_id: line.product.id, variant_id: line.variant?.id ?? null, quantity: line.quantity }))),
      )
      formData.set('discount', String(discount))
      formData.set('freight_value', String(freight))
      formData.set('machine_id', machineId)
      formData.set('payment_method', method)
      formData.set('card_brand', cardBrand)
      formData.set('installments', String(installments))
      formData.set('validity_days', String(validityDays))
      formData.set('notes', notes)

      const result = editOrcamento
        ? await updateOrcamento(editOrcamento.orcamentoId, undefined, formData)
        : await createOrcamento(undefined, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      if (result?.orcamentoId) {
        router.push(`/vendedor/orcamentos/${result.orcamentoId}`)
      }
    })
  }

  const stockWarnings = cart.filter((line) => {
    const available = line.variant?.stock ?? line.product.stock
    return available < line.quantity
  })

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Cliente</h2>
          {editOrcamento ? (
            <div className="rounded-lg border border-neutral-200 px-3 py-2">
              <p className="font-medium text-neutral-900">{editOrcamento.customerName}</p>
              <p className="text-xs text-neutral-500">O cliente não pode ser alterado na edição de um orçamento.</p>
            </div>
          ) : customer ? (
            <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2">
              <div>
                <p className="font-medium text-neutral-900">{customer.name}</p>
                <p className="text-xs text-neutral-500">{customer.phone}</p>
              </div>
              <button type="button" onClick={() => setCustomer(null)} className="text-sm text-neutral-500 hover:underline">
                Trocar
              </button>
            </div>
          ) : showNewCustomer ? (
            <div>
              <CustomerForm
                action={createCustomer}
                submitLabel="Cadastrar e selecionar"
                onSuccess={(customerId) => {
                  setCustomer({ id: customerId, name: customerQuery, phone: '', points: 0 })
                  setShowNewCustomer(false)
                }}
              />
              <button type="button" onClick={() => setShowNewCustomer(false)} className="mt-2 text-sm text-neutral-500 hover:underline">
                Cancelar
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                placeholder="Buscar cliente por nome ou telefone..."
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
              />
              {customerResults.length > 0 && (
                <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
                  {customerResults.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setCustomer(c)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50"
                      >
                        <span>{c.name}</span>
                        <span className="text-neutral-400">{c.phone}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" onClick={() => setShowNewCustomer(true)} className="text-sm text-neutral-600 hover:underline">
                + Cadastrar novo cliente
              </button>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Produtos</h2>
          <div className="space-y-2">
            <Input placeholder="Buscar por nome, SKU, marca ou modelo..." value={productQuery} onChange={(e) => setProductQuery(e.target.value)} />
            {productResults.length > 0 && (
              <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
                {productResults.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => handleProductClick(p)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50"
                    >
                      <span>
                        {p.name} {p.sku && <span className="text-neutral-400">({p.sku})</span>}
                        {p.variants.length > 0 && <span className="text-neutral-400"> · {p.variants.length} cor(es)</span>}
                      </span>
                      <span className="text-neutral-500">
                        {formatBRL(p.promo_price ?? p.price)} · estoque {p.stock}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {colorPickerProduct && (
              <div className="rounded-lg border border-brand-navy/30 bg-brand-navy/5 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-neutral-900">Escolha a cor: {colorPickerProduct.name}</p>
                  <button type="button" onClick={() => setColorPickerProduct(null)} className="text-xs text-neutral-500 hover:underline">
                    Cancelar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colorPickerProduct.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => addToCart(colorPickerProduct, v)}
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm hover:border-brand-navy"
                    >
                      {v.color_name} · {formatBRL(v.promo_price ?? v.price)} · estoque {v.stock}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {cart.length === 0 ? (
              <p className="text-sm text-neutral-400">Nenhum produto adicionado.</p>
            ) : (
              cart.map((line) => {
                const key = lineKey(line.product.id, line.variant?.id ?? null)
                const price = line.variant?.promo_price ?? line.variant?.price ?? line.product.promo_price ?? line.product.price
                const available = line.variant?.stock ?? line.product.stock
                return (
                  <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                    <span className="flex-1">
                      {line.product.name}
                      {line.variant && <span className="text-neutral-500"> — {line.variant.color_name}</span>}
                      {available < line.quantity && (
                        <span className="ml-2 text-xs font-medium text-amber-600">Estoque insuficiente ({available} disp.)</span>
                      )}
                    </span>
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) => updateQuantity(key, Number(e.target.value))}
                      className="w-16 rounded border border-neutral-300 px-2 py-1 text-center"
                    />
                    <span className="w-24 text-right text-neutral-600">{formatBRL(price * line.quantity)}</span>
                    <button type="button" onClick={() => removeLine(key)} className="text-red-600 hover:underline">
                      Remover
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Pagamento</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Máquina" htmlFor="machine">
              <Select id="machine" value={machineId} onChange={(e) => setMachineId(e.target.value)}>
                {machines.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Forma de pagamento" htmlFor="method">
              <Select id="method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
                {Object.entries(METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            {method === 'credito' && machine && (
              <Field label="Parcelas" htmlFor="installments">
                <Select id="installments" value={installments} onChange={(e) => setInstallments(Number(e.target.value))}>
                  {Array.from(
                    { length: machine.max_installments - machine.min_installments + 1 },
                    (_, i) => machine.min_installments + i,
                  ).map((n) => (
                    <option key={n} value={n}>
                      {n}x
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            {(method === 'debito' || method === 'credito') && (
              <Field label="Bandeira" htmlFor="card-brand" hint="Deixe em branco para usar a taxa padrão da máquina">
                <Input
                  id="card-brand"
                  placeholder="Visa, Master, Elo..."
                  value={cardBrand}
                  onChange={(e) => setCardBrand(e.target.value)}
                />
              </Field>
            )}
          </div>
        </Card>
      </div>

      <Card className="h-fit space-y-4">
        <h2 className="text-sm font-semibold text-neutral-900">Resumo</h2>
        <div>
          <Label htmlFor="discount">Desconto (R$)</Label>
          <CurrencyInput id="discount" value={discount} onValueChange={setDiscount} />
        </div>
        <div>
          <Label htmlFor="freight">Frete (R$)</Label>
          <CurrencyInput id="freight" value={freight} onValueChange={(v) => setFreight(Math.min(v, maxFreight))} />
          <p className="mt-1 text-xs text-neutral-500">Limite configurado: {formatBRL(maxFreight)}</p>
        </div>
        <div>
          <Label htmlFor="validity">Validade (dias)</Label>
          <Input id="validity" type="number" min={1} value={validityDays} onChange={(e) => setValidityDays(Number(e.target.value))} />
        </div>
        <div>
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="space-y-1 border-t border-neutral-200 pt-3 text-sm">
          <div className="flex justify-between text-neutral-500">
            <span>Subtotal</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Desconto</span>
            <span>-{formatBRL(discount)}</span>
          </div>
          <div className="flex justify-between text-neutral-500">
            <span>Frete</span>
            <span>+{formatBRL(freight)}</span>
          </div>

          {calculating && <p className="text-xs text-neutral-400">Calculando taxa...</p>}
          {fees && 'error' in fees && <p className="text-xs text-red-600">{fees.error}</p>}
          {fees && !('error' in fees) && (
            <>
              <div className="flex justify-between text-neutral-500">
                <span>Taxa aplicada</span>
                <span>
                  {fees.percentageApplied.toFixed(2)}%{fees.fixedValueApplied > 0 ? ` + ${formatBRL(fees.fixedValueApplied)}` : ''}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold text-neutral-900">
                <span>Total</span>
                <span>{formatBRL(fees.finalValue)}</span>
              </div>
              {fees.installmentCount > 1 ? (
                <p className="text-xs text-neutral-500">
                  {fees.installmentCount - 1}x de {formatBRL(fees.installmentValue)} + 1x de {formatBRL(fees.lastInstallmentValue)}
                </p>
              ) : (
                <p className="text-xs text-neutral-500">Pagamento único de {formatBRL(fees.lastInstallmentValue)}</p>
              )}
            </>
          )}
        </div>

        {stockWarnings.length > 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Estoque insuficiente para {stockWarnings.length} item(ns) — o orçamento pode ser salvo mesmo assim, mas não reserva estoque.
          </p>
        )}

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <Button className="w-full" disabled={isPending} onClick={handleSubmit}>
          {isPending ? 'Salvando...' : editOrcamento ? 'Salvar alterações' : 'Salvar orçamento'}
        </Button>
      </Card>
    </div>
  )
}
