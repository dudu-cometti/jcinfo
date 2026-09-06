import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { BrandForm } from './BrandForm'
import { DeleteBrandButton } from './DeleteBrandButton'
import { createBrand } from './actions'

export const metadata = { title: 'Marcas' }

export default async function AdminMarcasPage() {
  const supabase = await createClient()
  const { data: brands } = await supabase
    .from('brands')
    .select('id, name, slug, products(count)')
    .order('name')

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-lg font-semibold text-neutral-900">Marcas</h1>
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
                  <Td>{brand.products?.[0]?.count ?? 0}</Td>
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

      <Card className="h-fit">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Nova marca</h2>
        <BrandForm action={createBrand} submitLabel="Criar marca" />
      </Card>
    </div>
  )
}
