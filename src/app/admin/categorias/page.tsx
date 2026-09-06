import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { CategoryForm } from './CategoryForm'
import { DeleteCategoryButton } from './DeleteCategoryButton'
import { createCategory } from './actions'

export const metadata = { title: 'Categorias' }

export default async function AdminCategoriasPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, products(count)')
    .order('name')

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-lg font-semibold text-neutral-900">Categorias</h1>
        <Table>
          <Thead>
            <Th>Nome</Th>
            <Th>Slug</Th>
            <Th>Produtos</Th>
            <Th />
          </Thead>
          <tbody>
            {!categories || categories.length === 0 ? (
              <EmptyState message="Nenhuma categoria cadastrada." />
            ) : (
              categories.map((category) => (
                <Tr key={category.id}>
                  <Td className="font-medium text-neutral-900">{category.name}</Td>
                  <Td className="font-mono text-xs text-neutral-500">{category.slug}</Td>
                  <Td>{category.products?.[0]?.count ?? 0}</Td>
                  <Td>
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/categorias/${category.id}`}
                        className="text-sm text-neutral-600 hover:underline"
                      >
                        Editar
                      </Link>
                      <DeleteCategoryButton categoryId={category.id} />
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <Card className="h-fit">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Nova categoria</h2>
        <CategoryForm action={createCategory} submitLabel="Criar categoria" />
      </Card>
    </div>
  )
}
