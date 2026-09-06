import { SaleBuilder } from '@/components/sales/SaleBuilder'

export const metadata = { title: 'Nova venda' }

export default function NewSalePage() {
  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-neutral-900">Nova venda</h1>
      <SaleBuilder />
    </div>
  )
}
