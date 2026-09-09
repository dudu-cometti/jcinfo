import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { getOrcamento } from '@/lib/data/orcamentos'
import { OrcamentoDetail } from '@/components/orcamentos/OrcamentoDetail'

export const metadata = { title: 'Orçamento' }

export default async function VendedorOrcamentoDetailPage({ params }: PageProps<'/vendedor/orcamentos/[id]'>) {
  const { id } = await params
  const session = await requireRole('admin', 'vendedor')
  const result = await getOrcamento(session, id)
  if (!result) notFound()

  return (
    <OrcamentoDetail
      orcamento={result.orcamento}
      items={result.items}
      shareTokens={result.shareTokens}
      basePath="/vendedor/orcamentos"
      salesPath="/vendedor/vendas"
    />
  )
}
