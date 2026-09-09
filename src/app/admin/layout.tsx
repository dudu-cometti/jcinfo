import { requireRole } from '@/lib/auth/dal'
import { AppShell, type NavEntry } from '@/components/layout/AppShell'
import { logout } from '@/app/login/actions'

const NAV_ITEMS: NavEntry[] = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  {
    label: 'Catálogo',
    items: [
      { href: '/admin/produtos', label: 'Produtos' },
      { href: '/admin/categorias', label: 'Categorias' },
      { href: '/admin/marcas', label: 'Marcas' },
      { href: '/admin/estoque', label: 'Estoque' },
      { href: '/admin/entradas', label: 'Entradas de estoque' },
    ],
  },
  {
    label: 'Vendas',
    items: [
      { href: '/admin/vendas', label: 'Vendas' },
      { href: '/admin/orcamentos', label: 'Orçamentos' },
      { href: '/admin/clientes', label: 'Clientes' },
      { href: '/admin/comissoes', label: 'Comissões' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/admin/destaques', label: 'Destaques da home' },
      { href: '/admin/campanhas', label: 'Campanhas' },
      { href: '/admin/premios', label: 'Prêmios' },
      { href: '/admin/sorteios', label: 'Sorteios' },
      { href: '/admin/pre-vendas', label: 'Pré-vendas' },
      { href: '/admin/pontos', label: 'Pontos' },
    ],
  },
  {
    label: 'Equipe',
    items: [{ href: '/admin/vendedores', label: 'Vendedores' }],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/admin/relatorios', label: 'Relatórios' },
      { href: '/admin/taxas', label: 'Taxas de cartão' },
      { href: '/admin/configuracoes', label: 'Configurações' },
      { href: '/admin/logs', label: 'Logs' },
    ],
  },
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
