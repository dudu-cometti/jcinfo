import { requireRole } from '@/lib/auth/dal'
import { AppShell } from '@/components/layout/AppShell'
import { logout } from '@/app/login/actions'

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/destaques', label: 'Destaques da home' },
  { href: '/admin/produtos', label: 'Produtos' },
  { href: '/admin/categorias', label: 'Categorias' },
  { href: '/admin/marcas', label: 'Marcas' },
  { href: '/admin/estoque', label: 'Estoque' },
  { href: '/admin/vendas', label: 'Vendas' },
  { href: '/admin/clientes', label: 'Clientes' },
  { href: '/admin/pontos', label: 'Pontos' },
  { href: '/admin/campanhas', label: 'Campanhas' },
  { href: '/admin/premios', label: 'Prêmios' },
  { href: '/admin/sorteios', label: 'Sorteios' },
  { href: '/admin/pre-vendas', label: 'Pré-vendas' },
  { href: '/admin/vendedores', label: 'Vendedores' },
  { href: '/admin/relatorios', label: 'Relatórios' },
  { href: '/admin/comissoes', label: 'Comissões' },
  { href: '/admin/configuracoes', label: 'Configurações' },
  { href: '/admin/logs', label: 'Logs' },
]

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireRole('admin')

  return (
    <AppShell brandLabel="JC Info · Admin" navItems={NAV_ITEMS} userLabel={session.fullName} logoutAction={logout}>
      {children}
    </AppShell>
  )
}
