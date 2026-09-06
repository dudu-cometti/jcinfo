import { SaleDetail } from '@/components/sales/SaleDetail'

export const metadata = { title: 'Venda' }

export default async function AdminSaleDetailPage({ params }: PageProps<'/admin/vendas/[id]'>) {
  const { id } = await params
  return <SaleDetail saleId={id} isAdmin />
}
