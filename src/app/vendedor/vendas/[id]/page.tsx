import { requireSession } from '@/lib/auth/dal'
import { SaleDetail } from '@/components/sales/SaleDetail'

export const metadata = { title: 'Venda' }

export default async function VendedorSaleDetailPage({ params }: PageProps<'/vendedor/vendas/[id]'>) {
  const { id } = await params
  const session = await requireSession()

  return <SaleDetail saleId={id} isAdmin={session.role === 'admin'} />
}
