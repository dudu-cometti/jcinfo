import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Modal } from '@/components/ui/modal'
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
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-neutral-900">Categorias</h1>
        <Modal triggerLabel="+ Nova categoria" title="Nova categoria">
          <CategoryForm action={createCategory} submitLabel="Criar categoria" />
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
  )
}
