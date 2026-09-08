'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Textarea, Label } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatBRL } from '@/lib/utils'
import { computeCartTotals } from '@/lib/sales/totals'
import { createSale } from '@/lib/actions/sales'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { createCustomer } from '@/lib/actions/customers'

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

export function SaleBuilder() {
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
  const [cart, setCart] = useState<CartLine[]>([])
  const [discount, setDiscount] = useState(0)
  const [notes, setNotes] = useState('')

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
      prev.map((line) =>
        lineKey(line.product.id, line.variant?.id ?? null) === key
          ? { ...line, quantity: Math.max(1, quantity) }
          : line,
      ),
    )
  }

  function removeLine(key: string) {
    setCart((prev) => prev.filter((line) => lineKey(line.product.id, line.variant?.id ?? null) !== key))
  }

  const { subtotal, total } = computeCartTotals(
    cart.map((line) => ({
      price: line.variant?.price ?? line.product.price,
      promoPrice: line.variant?.promo_price ?? line.product.promo_price,
      quantity: line.quantity,
    })),
    discount,
  )

  function handleSubmit() {
    setError(null)
    if (!customer) {
      setError('Selecione um cliente.')
      return
    }
    if (cart.length === 0) {
      setError('Adicione ao menos um produto.')
      return
    }
    startTransition(async () => {
      const result = await createSale(
        customer.id,
        cart.map((line) => ({ product_id: line.product.id, variant_id: line.variant?.id ?? null, quantity: line.quantity })),
        discount,
        notes,
      )
      if (result?.error) {
        setError(result.error)
        return
      }
      if (result?.saleId) {
        router.push(`/vendedor/vendas/${result.saleId}`)
      }
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Cliente</h2>
          {customer ? (
            <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2">
              <div>
                <p className="font-medium text-neutral-900">{customer.name}</p>
                <p className="text-xs text-neutral-500">
                  {customer.phone} · {customer.points.toLocaleString('pt-BR')} pontos
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomer(null)}
                className="text-sm text-neutral-500 hover:underline"
              >
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
              <button
                type="button"
                onClick={() => setShowNewCustomer(false)}
                className="mt-2 text-sm text-neutral-500 hover:underline"
              >
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
              <button
                type="button"
                onClick={() => setShowNewCustomer(true)}
                className="text-sm text-neutral-600 hover:underline"
              >
                + Cadastrar novo cliente
              </button>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-neutral-900">Produtos</h2>
          <div className="space-y-2">
            <Input
              placeholder="Buscar por nome, SKU, marca ou modelo..."
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
            />
            {productResults.length > 0 && (
              <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
                {productResults.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => handleProductClick(p)}
                      disabled={p.stock === 0}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                  <button
                    type="button"
                    onClick={() => setColorPickerProduct(null)}
                    className="text-xs text-neutral-500 hover:underline"
                  >
                    Cancelar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colorPickerProduct.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      disabled={v.stock === 0}
                      onClick={() => addToCart(colorPickerProduct, v)}
                      className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm hover:border-brand-navy disabled:cursor-not-allowed disabled:opacity-40"
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
                const maxStock = line.variant?.stock ?? line.product.stock
                return (
                  <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
                    <span className="flex-1">
                      {line.product.name}
                      {line.variant && <span className="text-neutral-500"> — {line.variant.color_name}</span>}
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={maxStock}
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
      </div>

      <Card className="h-fit space-y-4">
        <h2 className="text-sm font-semibold text-neutral-900">Resumo</h2>
        <div>
          <Label htmlFor="discount">Desconto (R$)</Label>
          <CurrencyInput id="discount" value={discount} onValueChange={setDiscount} />
        </div>
        <div>
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
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
          <div className="flex justify-between text-base font-semibold text-neutral-900">
            <span>Total</span>
            <span>{formatBRL(total)}</span>
          </div>
          <p className="text-xs text-neutral-400">≈ {Math.floor(total)} pontos ao confirmar</p>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <Button className="w-full" disabled={isPending} onClick={handleSubmit}>
          {isPending ? 'Registrando...' : 'Registrar venda'}
        </Button>
      </Card>
    </div>
  )
}
