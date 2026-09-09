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

  // `products(count)` exige SELECT de tabela sem qualificação de coluna,
  // que products deixou de conceder a anon/authenticated (migration
  // 20260101000047). A contagem por categoria vem de uma função
  // SECURITY DEFINER própria.
  const [{ data: categories }, { data: counts }] = await Promise.all([
    supabase.from('categories').select('id, name, slug').order('name'),
    supabase.rpc('admin_category_product_counts'),
  ])

  const countByCategory = new Map<string, number>(
    (counts ?? []).map((c: { category_id: string; product_count: number }) => [c.category_id, c.product_count]),
  )

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
                <Td>{countByCategory.get(category.id) ?? 0}</Td>
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
