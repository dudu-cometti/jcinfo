import Link from 'next/link'
import { requireSession } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { StatCard } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatBRL } from '@/lib/utils'

export const metadata = { title: 'Dashboard' }

export default async function VendedorDashboardPage() {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: sales } = await supabase
    .from('sales')
    .select('status, total')
    .eq('seller_id', session.id)

  const rows = sales ?? []
  const pending = rows.filter((s) => s.status === 'pendente').length
  const completed = rows.filter((s) => s.status === 'concluida' || s.status === 'confirmada').length
  const revenue = rows
    .filter((s) => s.status === 'confirmada' || s.status === 'concluida')
    .reduce((sum, s) => sum + Number(s.total), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">Olá, {session.fullName}</h1>
        <Link href="/vendedor/vendas/nova">
          <Button>+ Nova venda</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Vendas pendentes" value={String(pending)} />
        <StatCard label="Vendas confirmadas/concluídas" value={String(completed)} />
        <StatCard label="Total vendido" value={formatBRL(revenue)} />
      </div>

      <div className="flex gap-3">
        <Link href="/vendedor/produtos">
          <Button variant="secondary">Buscar produtos</Button>
        </Link>
        <Link href="/vendedor/clientes">
          <Button variant="secondary">Buscar clientes</Button>
        </Link>
        <Link href="/vendedor/vendas">
          <Button variant="secondary">Minhas vendas</Button>
        </Link>
      </div>
    </div>
  )
}
