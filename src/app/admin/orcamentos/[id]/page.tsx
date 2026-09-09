import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { getOrcamento } from '@/lib/data/orcamentos'
import { OrcamentoDetail } from '@/components/orcamentos/OrcamentoDetail'

export const metadata = { title: 'Orçamento' }

export default async function AdminOrcamentoDetailPage({ params }: PageProps<'/admin/orcamentos/[id]'>) {
  const { id } = await params
  const session = await requireRole('admin')
  const result = await getOrcamento(session, id)
  if (!result) notFound()

  return (
    <OrcamentoDetail
      orcamento={result.orcamento}
      items={result.items}
      shareTokens={result.shareTokens}
      basePath="/admin/orcamentos"
      salesPath="/admin/vendas"
    />
  )
}
