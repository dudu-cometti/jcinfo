import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatBRL } from '@/lib/utils'

export const metadata = { title: 'Produtos' }

const PAGE_SIZE = 20

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminProdutosPage({
  searchParams,
}: PageProps<'/admin/produtos'>) {
  const params = await searchParams
  const q = firstParam(params.q) ?? ''
  const status = firstParam(params.status) ?? ''
  const brandId = firstParam(params.marca) ?? ''
  const page = Number(firstParam(params.page) ?? '1') || 1

  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select(
      'id, name, slug, sku, price, promo_price, stock, min_stock, status, featured, category:categories(name), brand:brands(name)',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (q) {
    query = query.or(
      `name.ilike.%${q}%,sku.ilike.%${q}%,model.ilike.%${q}%,internal_code.ilike.%${q}%`,
    )
  }
  if (status === 'ativo' || status === 'inativo') {
    query = query.eq('status', status)
  }
  if (brandId) {
    query = query.eq('brand_id', brandId)
  }
  if (status === 'baixo_estoque') {
    // stock <= min_stock can't be filtered server-side via PostgREST (two-column
    // comparison), so this option is combined with client-side filtering below.
  }

  type ProductRow = {
    id: string
    name: string
    slug: string
    sku: string | null
    price: number
    promo_price: number | null
    stock: number
    min_stock: number
    status: 'ativo' | 'inativo'
    featured: boolean
    category: { name: string } | null
    brand: { name: string } | null
  }

  const [{ data, count }, { data: brands }] = await Promise.all([
    query,
    supabase.from('brands').select('id, name').order('name'),
  ])
  const products = (data ?? []) as unknown as ProductRow[]
  const visibleProducts = status === 'baixo_estoque' ? products.filter((p) => p.stock <= p.min_stock) : products

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-neutral-900">Produtos</h1>
        <Link href="/admin/produtos/novo">
          <Button>+ Novo produto</Button>
        </Link>
      </div>

      <form className="flex flex-wrap gap-3">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome, SKU, modelo..."
          className="max-w-sm"
        />
        <Select name="status" defaultValue={status} className="max-w-[200px]">
          <option value="">Todos os status</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
          <option value="baixo_estoque">Estoque baixo</option>
        </Select>
        <Select name="marca" defaultValue={brandId} className="max-w-[200px]">
          <option value="">Todas as marcas</option>
          {(brands ?? []).map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      <Table>
        <Thead>
          <Th>Produto</Th>
          <Th>Categoria</Th>
          <Th>Marca</Th>
          <Th>Preço</Th>
          <Th>Estoque</Th>
          <Th>Status</Th>
          <Th />
        </Thead>
        <tbody>
          {visibleProducts.length === 0 ? (
            <EmptyState message="Nenhum produto encontrado." />
          ) : (
            visibleProducts.map((product) => (
              <Tr key={product.id}>
                <Td>
                  <div className="font-medium text-neutral-900">{product.name}</div>
                  {product.sku && <div className="text-xs text-neutral-400">SKU: {product.sku}</div>}
                </Td>
                <Td>{product.category?.name ?? '—'}</Td>
                <Td>{product.brand?.name ?? '—'}</Td>
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
                  <span className={product.stock <= product.min_stock ? 'font-medium text-red-600' : ''}>
                    {product.stock}
                  </span>
                </Td>
                <Td>
                  <div className="flex flex-col gap-1">
                    <Badge tone={product.status === 'ativo' ? 'green' : 'neutral'}>
                      {product.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </Badge>
                    {product.featured && <Badge tone="yellow">Destaque</Badge>}
                  </div>
                </Td>
                <Td>
                  <Link href={`/admin/produtos/${product.id}`} className="text-sm text-neutral-600 hover:underline">
                    Editar
                  </Link>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/produtos?${new URLSearchParams({ q, status, marca: brandId, page: String(p) }).toString()}`}
              className={`rounded-md px-3 py-1 ${p === page ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
