import Link from 'next/link'
import { Card } from '@/components/ui/card'

export const metadata = { title: 'Relatórios' }

const REPORTS = [
  { href: '/admin/relatorios/vendas', label: 'Vendas', description: 'Faturamento, ticket médio e exportação em CSV.' },
  { href: '/admin/relatorios/vendedores', label: 'Vendedores', description: 'Ranking de vendas e comissão por vendedor.' },
  { href: '/admin/relatorios/lucro', label: 'Lucro', description: 'Faturamento, custo e margem por produto (só admin).' },
  { href: '/admin/relatorios/giro-estoque', label: 'Giro de estoque', description: 'Produtos que mais saem e os parados/encalhados.' },
  { href: '/admin/produtos', label: 'Produtos', description: 'Catálogo, estoque e destaque.' },
  { href: '/admin/estoque', label: 'Estoque', description: 'Movimentações e alertas de estoque baixo.' },
  { href: '/admin/clientes', label: 'Clientes', description: 'Base de clientes cadastrados.' },
  { href: '/admin/pontos', label: 'Pontos', description: 'Ranking de pontos dos clientes.' },
  { href: '/admin/campanhas', label: 'Campanhas', description: 'Campanhas de pontos ativas e encerradas.' },
  { href: '/admin/sorteios', label: 'Sorteios', description: 'Participantes e resultados dos sorteios.' },
  { href: '/admin/comissoes', label: 'Comissão', description: 'Comissões geradas por venda e por vendedor.' },
]

export default function AdminRelatoriosPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-neutral-900">Relatórios</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => (
          <Link key={report.href} href={report.href}>
            <Card className="h-full transition hover:border-neutral-300 hover:shadow-md">
              <h2 className="font-medium text-neutral-900">{report.label}</h2>
              <p className="mt-1 text-sm text-neutral-500">{report.description}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
