import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { RewardForm } from './RewardForm'
import { createReward, deleteReward } from '@/lib/actions/rewards'

export const metadata = { title: 'Prêmios' }

export default async function AdminPremiosPage() {
  const supabase = await createClient()
  const { data: rewards } = await supabase.from('rewards').select('*').order('points_required')

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="mb-4 text-lg font-semibold text-neutral-900">Prêmios</h1>
        <Table>
          <Thead>
            <Th>Nome</Th>
            <Th>Pontos</Th>
            <Th>Estoque</Th>
            <Th>Status</Th>
            <Th />
          </Thead>
          <tbody>
            {!rewards || rewards.length === 0 ? (
              <EmptyState message="Nenhum prêmio cadastrado." />
            ) : (
              rewards.map((reward) => (
                <Tr key={reward.id}>
                  <Td className="font-medium text-neutral-900">{reward.name}</Td>
                  <Td>{reward.points_required.toLocaleString('pt-BR')}</Td>
                  <Td>{reward.quantity}</Td>
                  <Td>
                    <Badge tone={reward.status === 'ativo' ? 'green' : 'neutral'}>{reward.status}</Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/premios/${reward.id}`} className="text-sm text-neutral-600 hover:underline">
                        Editar
                      </Link>
                      <form action={deleteReward.bind(null, reward.id)}>
                        <button type="submit" className="text-sm text-red-600 hover:underline">
                          Excluir
                        </button>
                      </form>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </div>

      <Card className="h-fit">
        <h2 className="mb-4 text-sm font-semibold text-neutral-900">Novo prêmio</h2>
        <RewardForm action={createReward} submitLabel="Criar prêmio" />
      </Card>
    </div>
  )
}
