'use client'

import { deleteBrand } from './actions'

export function DeleteBrandButton({ brandId }: { brandId: string }) {
  return (
    <form
      action={() => deleteBrand(brandId)}
      onSubmit={(e) => {
        if (!confirm('Excluir esta marca? Produtos vinculados ficarão sem marca.')) {
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
