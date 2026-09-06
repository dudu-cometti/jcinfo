import { createClient } from '@/lib/supabase/server'
import { Input, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatBRL } from '@/lib/utils'

export const metadata = { title: 'Produtos' }

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function VendedorProdutosPage({ searchParams }: PageProps<'/vendedor/produtos'>) {
  const params = await searchParams
  const q = firstParam(params.q) ?? ''
  const brandId = firstParam(params.marca) ?? ''

  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select('id, name, sku, model, price, promo_price, stock, status, category:categories(name), brand:brands(name)')
    .order('name')
    .limit(100)

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,model.ilike.%${q}%`)
  }
  if (brandId) {
    query = query.eq('brand_id', brandId)
  }

  const [{ data }, { data: brands }] = await Promise.all([
    query,
    supabase.from('brands').select('id, name').order('name'),
  ])

  type ProductRow = {
    id: string
    name: string
    sku: string | null
    model: string | null
    price: number
    promo_price: number | null
    stock: number
    status: string
    category: { name: string } | null
    brand: { name: string } | null
  }
  const products = (data ?? []) as unknown as ProductRow[]

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-neutral-900">Produtos</h1>

      <form className="flex flex-wrap gap-3">
        <Input name="q" defaultValue={q} placeholder="Buscar por nome, SKU, modelo..." className="max-w-sm" />
        <Select name="marca" defaultValue={brandId} className="max-w-[200px]">
          <option value="">Todas as marcas</option>
          {(brands ?? []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
      </form>

      <Table>
        <Thead>
          <Th>Produto</Th>
          <Th>Categoria</Th>
          <Th>Preço</Th>
          <Th>Estoque</Th>
        </Thead>
        <tbody>
          {products.length === 0 ? (
            <EmptyState message="Nenhum produto encontrado." />
          ) : (
            products.map((product) => (
              <Tr key={product.id}>
                <Td>
                  <div className="font-medium text-neutral-900">{product.name}</div>
                  <div className="text-xs text-neutral-400">
                    {[product.brand?.name, product.model, product.sku].filter(Boolean).join(' · ')}
                  </div>
                </Td>
                <Td>{product.category?.name ?? '—'}</Td>
                <Td>
                  {product.promo_price ? (
                    <div>
                      <span className="text-neutral-400 line-through">{formatBRL(product.price)}</span>{' '}
                      <span className="font-medium text-neutral-900">{formatBRL(product.promo_price)}</span>
                    </div>
                  ) : (
                    formatBRL(product.price)
                  )}
                </Td>
                <Td>
                  {product.stock === 0 ? (
                    <Badge tone="red">Esgotado</Badge>
                  ) : (
                    <span>{product.stock} un.</span>
                  )}
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  )
}
