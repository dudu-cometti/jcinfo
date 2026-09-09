import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Modal } from '@/components/ui/modal'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { BrandForm } from './BrandForm'
import { DeleteBrandButton } from './DeleteBrandButton'
import { createBrand } from './actions'

export const metadata = { title: 'Marcas' }

export default async function AdminMarcasPage() {
  const supabase = await createClient()

  // `products(count)` exige SELECT de tabela sem qualificação de coluna,
  // que products deixou de conceder a anon/authenticated (migration
  // 20260101000047). A contagem por marca vem de uma função
  // SECURITY DEFINER própria.
  const [{ data: brands }, { data: counts }] = await Promise.all([
    supabase.from('brands').select('id, name, slug').order('name'),
    supabase.rpc('admin_brand_product_counts'),
  ])

  const countByBrand = new Map<string, number>(
    (counts ?? []).map((c: { brand_id: string; product_count: number }) => [c.brand_id, c.product_count]),
  )

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-neutral-900">Marcas</h1>
        <Modal triggerLabel="+ Nova marca" title="Nova marca">
          <BrandForm action={createBrand} submitLabel="Criar marca" />
        </Modal>
      </div>

      <Table>
        <Thead>
          <Th>Nome</Th>
          <Th>Slug</Th>
          <Th>Produtos</Th>
          <Th />
        </Thead>
        <tbody>
          {!brands || brands.length === 0 ? (
            <EmptyState message="Nenhuma marca cadastrada." />
          ) : (
            brands.map((brand) => (
              <Tr key={brand.id}>
                <Td className="font-medium text-neutral-900">{brand.name}</Td>
                <Td className="font-mono text-xs text-neutral-500">{brand.slug}</Td>
                <Td>{countByBrand.get(brand.id) ?? 0}</Td>
                <Td>
                  <div className="flex items-center justify-end gap-3">
                    <Link href={`/admin/marcas/${brand.id}`} className="text-sm text-neutral-600 hover:underline">
                      Editar
                    </Link>
                    <DeleteBrandButton brandId={brand.id} />
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  )
}
