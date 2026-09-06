import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, Thead, Th, Tr, Td, EmptyState } from '@/components/ui/table'
import { formatDate } from '@/lib/utils'
import { SellerRowActions } from './SellerRowActions'

export const metadata = { title: 'Vendedores' }

export default async function AdminVendedoresPage() {
  const supabase = await createClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, active, phone, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-neutral-900">Vendedores e administradores</h1>
        <Link href="/admin/vendedores/novo">
          <Button>+ Novo usuário</Button>
        </Link>
      </div>

      <Table>
        <Thead>
          <Th>Nome</Th>
          <Th>Função</Th>
          <Th>Status</Th>
          <Th>Desde</Th>
          <Th />
        </Thead>
        <tbody>
          {!profiles || profiles.length === 0 ? (
            <EmptyState message="Nenhum usuário cadastrado." />
          ) : (
            profiles.map((profile) => (
              <Tr key={profile.id}>
                <Td className="font-medium text-neutral-900">{profile.full_name}</Td>
                <Td>
                  <Badge tone={profile.role === 'admin' ? 'blue' : 'neutral'}>{profile.role}</Badge>
                </Td>
                <Td>
                  <Badge tone={profile.active ? 'green' : 'red'}>{profile.active ? 'Ativo' : 'Inativo'}</Badge>
                </Td>
                <Td className="text-xs text-neutral-500">{formatDate(profile.created_at)}</Td>
                <Td>
                  <SellerRowActions profileId={profile.id} role={profile.role} active={profile.active} />
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </div>
  )
}
