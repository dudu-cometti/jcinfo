import { createClient } from '@/lib/supabase/server'
import { Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatDateTime } from '@/lib/utils'

export const metadata = { title: 'Logs de auditoria' }

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function AdminLogsPage({ searchParams }: PageProps<'/admin/logs'>) {
  const params = await searchParams
  const table = firstParam(params.table) ?? ''

  const supabase = await createClient()
  let query = supabase
    .from('audit_logs')
    .select('id, action, resource_table, resource_id, data, created_at, user:profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (table) query = query.eq('resource_table', table)

  const { data: logs } = await query

  type LogRow = {
    id: string
    action: string
    resource_table: string
    resource_id: string | null
    data: unknown
    created_at: string
    user: { full_name: string } | null
  }
  const rows = (logs ?? []) as unknown as LogRow[]

  const tables = [
    'products',
    'categories',
    'customers',
    'sales',
    'commissions',
    'commission_rules',
    'point_campaigns',
    'rewards',
    'raffles',
    'site_settings',
  ]

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-neutral-900">Logs de auditoria</h1>

      <form className="flex gap-3">
        <Select name="table" defaultValue={table} className="max-w-[220px]">
          <option value="">Todas as tabelas</option>
          {tables.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      <Table>
        <Thead>
          <Th>Data</Th>
          <Th>Usuário</Th>
          <Th>Ação</Th>
          <Th>Recurso</Th>
          <Th>Dados</Th>
        </Thead>
        <tbody>
          {rows.length === 0 ? (
            <EmptyState message="Nenhum log encontrado." />
          ) : (
            rows.map((log) => (
              <Tr key={log.id}>
                <Td className="whitespace-nowrap text-xs text-neutral-500">{formatDateTime(log.created_at)}</Td>
                <Td>{log.user?.full_name ?? 'Sistema'}</Td>
                <Td className="font-mono text-xs">{log.action}</Td>
                <Td className="text-xs text-neutral-500">
                  {log.resource_table}
                  {log.resource_id && <span className="text-neutral-400"> #{log.resource_id.slice(0, 8)}</span>}
                </Td>
                <Td className="max-w-xs truncate text-xs text-neutral-400" title={JSON.stringify(log.data)}>
                  {log.data ? JSON.stringify(log.data) : '—'}
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  )
}
