import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatBRL } from '@/lib/utils'

export const metadata = { title: 'Taxas' }

const METHOD_LABELS: Record<string, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  debito: 'Débito',
  credito: 'Crédito',
}

export default async function VendedorTaxasPage() {
  const supabase = await createClient()

  const [{ data: machines }, { data: rules }] = await Promise.all([
    supabase
      .from('payment_machines')
      .select('id, name, min_installments, max_installments, status')
      .eq('status', 'ativo')
      .order('created_at'),
    supabase
      .from('payment_rate_rules')
      .select('id, machine_id, method, installments, card_brand, percentage, fixed_value')
      .eq('status', 'ativa')
      .order('installments'),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-neutral-900">Taxas de cartão</h1>
      <p className="text-sm text-neutral-500">Consulta apenas — as taxas são definidas pelo administrador.</p>

      {(machines ?? []).map((machine) => (
        <Card key={machine.id}>
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-neutral-900">{machine.name}</h2>
            <p className="text-xs text-neutral-500">
              Parcelas de {machine.min_installments}x a {machine.max_installments}x
            </p>
          </div>
          <Table>
            <Thead>
              <Th>Forma</Th>
              <Th>Parcelas</Th>
              <Th>Bandeira</Th>
              <Th>Taxa %</Th>
              <Th>Taxa fixa</Th>
            </Thead>
            <tbody>
              {(rules ?? []).filter((r) => r.machine_id === machine.id).length === 0 ? (
                <EmptyState message="Nenhuma taxa ativa nesta máquina." />
              ) : (
                (rules ?? [])
                  .filter((r) => r.machine_id === machine.id)
                  .map((rule) => (
                    <Tr key={rule.id}>
                      <Td>{METHOD_LABELS[rule.method] ?? rule.method}</Td>
                      <Td>{rule.installments}x</Td>
                      <Td>
                        {rule.card_brand ?? <Badge tone="blue">Qualquer</Badge>}
                      </Td>
                      <Td>{rule.percentage.toFixed(2)}%</Td>
                      <Td>{rule.fixed_value ? formatBRL(rule.fixed_value) : '-'}</Td>
                    </Tr>
                  ))
              )}
            </tbody>
          </Table>
        </Card>
      ))}
    </div>
  )
}
