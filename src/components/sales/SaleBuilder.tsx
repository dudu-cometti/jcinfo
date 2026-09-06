'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input, Textarea, Label } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { formatBRL } from '@/lib/utils'
import { computeCartTotals } from '@/lib/sales/totals'
import { createSale } from '@/lib/actions/sales'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { createCustomer } from '@/lib/actions/customers'

type Customer = { id: string; name: string; phone: string; points: number }
type Product = {
  id: string
  name: string
  sku: string | null
  price: number
  promo_price: number | null
  stock: number
}
type CartLine = { product: Product; quantity: number }

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
  const [cart, setCart] = useState<CartLine[]>([])
  const [discount, setDiscount] = useState('0')
  const [notes, setNotes] = useState('')

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((line) => line.product.id === product.id)
      if (existing) {
        return prev.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    setProductQuery('')
  }

  function updateQuantity(productId: string, quantity: number) {
    setCart((prev) =>
      prev.map((line) => (line.product.id === productId ? { ...line, quantity: Math.max(1, quantity) } : line)),
    )
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((line) => line.product.id !== productId))
  }

  const discountValue = Number(discount) || 0
  const { subtotal, total } = computeCartTotals(
    cart.map((line) => ({ price: line.product.price, promoPrice: line.product.promo_price, quantity: line.quantity })),
    discountValue,
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
        cart.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
        discountValue,
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
                      onClick={() => addToCart(p)}
                      disabled={p.stock === 0}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span>
                        {p.name} {p.sku && <span className="text-neutral-400">({p.sku})</span>}
                      </span>
                      <span className="text-neutral-500">
                        {formatBRL(p.promo_price ?? p.price)} · estoque {p.stock}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {cart.length === 0 ? (
              <p className="text-sm text-neutral-400">Nenhum produto adicionado.</p>
            ) : (
              cart.map((line) => (
                <div
                  key={line.product.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                >
                  <span className="flex-1">{line.product.name}</span>
                  <input
                    type="number"
                    min={1}
                    max={line.product.stock}
                    value={line.quantity}
                    onChange={(e) => updateQuantity(line.product.id, Number(e.target.value))}
                    className="w-16 rounded border border-neutral-300 px-2 py-1 text-center"
                  />
                  <span className="w-24 text-right text-neutral-600">
                    {formatBRL((line.product.promo_price ?? line.product.price) * line.quantity)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeLine(line.product.id)}
                    className="text-red-600 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="h-fit space-y-4">
        <h2 className="text-sm font-semibold text-neutral-900">Resumo</h2>
        <div>
          <Label htmlFor="discount">Desconto (R$)</Label>
          <Input
            id="discount"
            type="number"
            min={0}
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
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
            <span>-{formatBRL(discountValue)}</span>
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
