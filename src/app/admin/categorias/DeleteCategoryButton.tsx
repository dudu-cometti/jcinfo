'use client'

import { deleteCategory } from './actions'

export function DeleteCategoryButton({ categoryId }: { categoryId: string }) {
  return (
    <form
      action={() => deleteCategory(categoryId)}
      onSubmit={(e) => {
        if (!confirm('Excluir esta categoria? Produtos vinculados ficarão sem categoria.')) {
          e.preventDefault()
        }
      }}
    >
      <button type="submit" className="text-sm text-red-600 hover:underline">
        Excluir
      </button>
    </form>
  )
}
