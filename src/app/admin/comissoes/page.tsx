import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatBRL, formatDate } from '@/lib/utils'
import { CommissionRuleForm } from './CommissionRuleForm'
import { CommissionStatusSelect } from './CommissionStatusSelect'
import { createCommissionRule, toggleCommissionRuleStatus } from '@/lib/actions/commissions'

export const metadata = { title: 'Comissões' }

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminComissoesPage({ searchParams }: PageProps<'/admin/comissoes'>) {
  const params = await searchParams
  const status = firstParam(params.status) ?? ''

  const supabase = await createClient()

  let commissionsQuery = supabase
    .from('commissions')
    .select('id, sale_amount, commission_amount, percentage_applied, fixed_value_applied, status, created_at, seller:profiles(full_name), sale:sales(id)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) commissionsQuery = commissionsQuery.eq('status', status)

  const [{ data: rules }, { data: commissions }] = await Promise.all([
    supabase.from('commission_rules').select('*').order('created_at', { ascending: false }),
    commissionsQuery,
  ])

  type CommissionRow = {
    id: string
    sale_amount: number
    commission_amount: number
    percentage_applied: number | null
    fixed_value_applied: number | null
    status: string
    created_at: string
    seller: { full_name: string } | null
    sale: { id: string } | null
  }
  const commissionRows = (commissions ?? []) as unknown as CommissionRow[]
  const totalCommission = commissionRows.reduce((sum, c) => sum + Number(c.commission_amount), 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-4 text-lg font-semibold text-neutral-900">Regras de comissão</h1>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Table>
              <Thead>
                <Th>Nome</Th>
                <Th>Percentual</Th>
                <Th>Valor fixo</Th>
                <Th>Vigência</Th>
                <Th>Status</Th>
                <Th />
              </Thead>
              <tbody>
                {!rules || rules.length === 0 ? (
                  <EmptyState message="Nenhuma regra de comissão cadastrada." />
                ) : (
                  rules.map((rule) => (
                    <Tr key={rule.id}>
                      <Td className="font-medium text-neutral-900">{rule.name}</Td>
                      <Td>{rule.percentage ? `${rule.percentage}%` : '—'}</Td>
                      <Td>{rule.fixed_value ? formatBRL(rule.fixed_value) : '—'}</Td>
                      <Td className="text-xs text-neutral-500">
                        {rule.period_start ? formatDate(rule.period_start) : '∞'} -{' '}
                        {rule.period_end ? formatDate(rule.period_end) : '∞'}
                      </Td>
                      <Td>
                        <Badge tone={rule.status === 'ativa' ? 'green' : 'neutral'}>{rule.status}</Badge>
                      </Td>
                      <Td>
                        <form
                          action={toggleCommissionRuleStatus.bind(
                            null,
                            rule.id,
                            rule.status === 'ativa' ? 'inativa' : 'ativa',
                          )}
                        >
                          <button type="submit" className="text-sm text-neutral-600 hover:underline">
                            {rule.status === 'ativa' ? 'Desativar' : 'Ativar'}
                          </button>
                        </form>
                      </Td>
                    </Tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          <Card className="h-fit">
            <h2 className="mb-4 text-sm font-semibold text-neutral-900">Nova regra</h2>
            <CommissionRuleForm action={createCommissionRule} submitLabel="Criar regra" />
          </Card>
        </div>
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">Relatório de comissões</h2>
          <form className="flex gap-3">
            <Select name="status" defaultValue={status} className="max-w-[200px]">
              <option value="">Todos os status</option>
              <option value="pendente">Pendente</option>
              <option value="aprovada">Aprovada</option>
              <option value="paga">Paga</option>
              <option value="cancelada">Cancelada</option>
            </Select>
            <Button type="submit" variant="secondary">
              Filtrar
            </Button>
          </form>
        </div>

        <p className="mb-3 text-sm text-neutral-500">
          Total no filtro atual: <strong>{formatBRL(totalCommission)}</strong>
        </p>

        <Table>
          <Thead>
            <Th>Data</Th>
            <Th>Vendedor</Th>
            <Th>Valor da venda</Th>
            <Th>Regra aplicada</Th>
            <Th>Comissão</Th>
            <Th>Status</Th>
          </Thead>
          <tbody>
            {commissionRows.length === 0 ? (
              <EmptyState message="Nenhuma comissão encontrada." />
            ) : (
              commissionRows.map((c) => (
                <Tr key={c.id}>
                  <Td className="text-xs text-neutral-500">{formatDate(c.created_at)}</Td>
                  <Td>{c.seller?.full_name ?? '—'}</Td>
                  <Td>{formatBRL(c.sale_amount)}</Td>
                  <Td className="text-xs text-neutral-500">
                    {c.percentage_applied ? `${c.percentage_applied}%` : ''}
                    {c.fixed_value_applied ? ` + ${formatBRL(c.fixed_value_applied)}` : ''}
                  </Td>
                  <Td className="font-medium">{formatBRL(c.commission_amount)}</Td>
                  <Td>
                    <CommissionStatusSelect commissionId={c.id} status={c.status} />
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
