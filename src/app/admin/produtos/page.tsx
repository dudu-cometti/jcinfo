import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td } from '@/components/ui/table'
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

  // Contagem/paginação exigem SELECT de tabela sem qualificação de coluna,
  // que products deixou de conceder a anon/authenticated (migration
  // 20260101000047) para fechar de vez o acesso a cost/internal_code. A
  // listagem do admin passa a vir de uma função SECURITY DEFINER, que não
  // depende de GRANT nenhum do chamador.
  const [{ data, error }, { data: brands }] = await Promise.all([
    supabase.rpc('admin_list_products', {
      p_search: q || null,
      p_status: status === 'ativo' || status === 'inativo' ? status : null,
      p_brand_id: brandId || null,
      p_limit: PAGE_SIZE,
      p_offset: (page - 1) * PAGE_SIZE,
    }),
    supabase.from('brands').select('id, name').order('name'),
  ])

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
    category_name: string | null
    brand_name: string | null
    total_count: number
  }

  const rows = (error ? [] : (data as unknown as ProductRow[])) ?? []
  const visibleProducts = status === 'baixo_estoque' ? rows.filter((p) => p.stock <= p.min_stock) : rows
  const count = rows[0]?.total_count ?? 0

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))

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

      {visibleProducts.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-10 text-center text-sm text-neutral-400">
          Nenhum produto encontrado.
        </div>
      ) : (
        <>
          {/* Cards no celular: a tabela completa não cabe numa tela pequena. */}
          <div className="grid grid-cols-1 gap-3 sm:hidden">
            {visibleProducts.map((product) => (
              <div key={product.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-neutral-900">{product.name}</div>
                    <div className="mt-1">
                      {product.promo_price ? (
                        <span>
                          <span className="text-neutral-400 line-through">{formatBRL(product.price)}</span>{' '}
                          <span className="font-medium text-neutral-900">{formatBRL(product.promo_price)}</span>
                        </span>
                      ) : (
                        <span className="text-neutral-700">{formatBRL(product.price)}</span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge tone={product.status === 'ativo' ? 'green' : 'neutral'}>
                        {product.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                      {product.featured && <Badge tone="yellow">Destaque</Badge>}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2 text-sm">
                    <Link href={`/admin/produtos/${product.id}#imagens`} className="text-neutral-600 hover:underline">
                      Fotos
                    </Link>
                    <Link href={`/admin/produtos/${product.id}`} className="font-medium text-neutral-900 hover:underline">
                      Editar
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tabela completa a partir de sm. */}
          <div className="hidden sm:block">
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
                {visibleProducts.map((product) => (
                  <Tr key={product.id}>
                    <Td>
                      <div className="font-medium text-neutral-900">{product.name}</div>
                      {product.sku && <div className="text-xs text-neutral-400">SKU: {product.sku}</div>}
                    </Td>
                    <Td>{product.category_name ?? '-'}</Td>
                    <Td>{product.brand_name ?? '-'}</Td>
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
                      <div className="flex items-center justify-end gap-3">
                        <Link href={`/admin/produtos/${product.id}#imagens`} className="text-sm text-neutral-600 hover:underline">
                          Fotos
                        </Link>
                        <Link href={`/admin/produtos/${product.id}`} className="text-sm text-neutral-600 hover:underline">
                          Editar
                        </Link>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/produtos?${new URLSearchParams({ q, status, marca: brandId, page: String(p) }).toString()}`}
              className={`rounded-md px-3 py-1 ${p === page ? 'bg-brand-navy text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
