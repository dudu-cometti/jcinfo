import { getStockVelocity } from '@/lib/data/stock-velocity'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Giro de estoque' }

export default async function GiroEstoquePage() {
  const { fastest, slowest } = await getStockVelocity()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Giro de estoque</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Baseado nas vendas confirmadas dos últimos 180 dias. Datas de entrada/saída detalhadas ficam em{' '}
          <a href="/admin/estoque" className="underline">
            Estoque
          </a>
          .
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Produtos que mais saem</h2>
        <Table>
          <Thead>
            <Th>Produto</Th>
            <Th>Vendidos (180d)</Th>
            <Th>Velocidade</Th>
            <Th>Estoque atual</Th>
            <Th>Previsão de duração</Th>
          </Thead>
          <tbody>
            {fastest.length === 0 ? (
              <EmptyState message="Nenhuma venda confirmada nos últimos 180 dias." />
            ) : (
              fastest.map((p) => (
                <Tr key={p.productId}>
                  <Td className="font-medium text-neutral-900">
                    {p.name}
                    {p.sku && <span className="ml-2 text-xs text-neutral-400">{p.sku}</span>}
                  </Td>
                  <Td>{p.totalSold} un.</Td>
                  <Td>{p.unitsPerDay.toFixed(2)} un./dia</Td>
                  <Td>{p.stock} un.</Td>
                  <Td>
                    {p.daysOfStockLeft !== null ? (
                      <Badge tone={p.daysOfStockLeft <= 7 ? 'red' : p.daysOfStockLeft <= 30 ? 'yellow' : 'green'}>
                        ~{p.daysOfStockLeft} dias
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Produtos parados (encalhados)</h2>
        <Card className="mb-3 border-yellow-200 bg-yellow-50">
          <p className="text-sm text-yellow-800">
            Produtos com estoque disponível que não vendem há mais tempo — candidatos a promoção.
          </p>
        </Card>
        <Table>
          <Thead>
            <Th>Produto</Th>
            <Th>Estoque atual</Th>
            <Th>Última venda</Th>
            <Th>Parado há</Th>
          </Thead>
          <tbody>
            {slowest.length === 0 ? (
              <EmptyState message="Nenhum produto com estoque disponível no momento." />
            ) : (
              slowest.map((p) => (
                <Tr key={p.productId}>
                  <Td className="font-medium text-neutral-900">
                    {p.name}
                    {p.sku && <span className="ml-2 text-xs text-neutral-400">{p.sku}</span>}
                  </Td>
                  <Td>{p.stock} un.</Td>
                  <Td>{p.lastSaleAt ? formatDate(p.lastSaleAt) : 'Nunca vendido'}</Td>
                  <Td>
                    {p.daysSinceLastSale !== null ? (
                      <Badge tone={p.daysSinceLastSale >= 90 ? 'red' : 'neutral'}>{p.daysSinceLastSale} dias</Badge>
                    ) : (
                      <Badge tone="red">Desde o cadastro</Badge>
                    )}
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  )
}
