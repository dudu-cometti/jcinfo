import { type NextRequest } from 'next/server'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { resolveDateRange, type DateRangeKey } from '@/lib/data/date-range'
import { toCsv } from '@/lib/reports/csv'
import { formatDateTime } from '@/lib/utils'

export async function GET(request: NextRequest) {
  await requireRole('admin')

  const params = request.nextUrl.searchParams
  const rangeKey = (params.get('range') ?? undefined) as DateRangeKey | undefined
  const from = params.get('from') ?? undefined
  const to = params.get('to') ?? undefined
  const { start, end } = resolveDateRange(rangeKey, from, to)

  const supabase = await createClient()
  const { data } = await supabase
    .from('sales')
    .select(
      'id, status, subtotal, discount, total, points_generated, created_at, confirmed_at, customer:customers(name, phone), seller:profiles(full_name)',
    )
    .in('status', ['confirmada', 'concluida'])
    .gte('confirmed_at', start.toISOString())
    .lte('confirmed_at', end.toISOString())
    .order('confirmed_at', { ascending: false })

  type Row = {
    id: string
    status: string
    subtotal: number
    discount: number
    total: number
    points_generated: number
    created_at: string
    confirmed_at: string | null
    customer: { name: string; phone: string } | null
    seller: { full_name: string } | null
  }
  const rows = (data ?? []) as unknown as Row[]

  const csv = toCsv(
    rows.map((r) => ({
      id: r.id,
      data: r.confirmed_at ? formatDateTime(r.confirmed_at) : formatDateTime(r.created_at),
      cliente: r.customer?.name ?? '',
      telefone: r.customer?.phone ?? '',
      vendedor: r.seller?.full_name ?? '',
      status: r.status,
      subtotal: r.subtotal,
      desconto: r.discount,
      total: r.total,
      pontos_gerados: r.points_generated,
    })),
    [
      { key: 'id', label: 'ID' },
      { key: 'data', label: 'Data' },
      { key: 'cliente', label: 'Cliente' },
      { key: 'telefone', label: 'Telefone' },
      { key: 'vendedor', label: 'Vendedor' },
      { key: 'status', label: 'Status' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'desconto', label: 'Desconto' },
      { key: 'total', label: 'Total' },
      { key: 'pontos_gerados', label: 'Pontos gerados' },
    ],
  )

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="vendas-${rangeKey ?? 'periodo'}.csv"`,
    },
  })
}
