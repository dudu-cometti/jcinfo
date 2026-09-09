import { requireRole } from '@/lib/auth/dal'
import { AppShell } from '@/components/layout/AppShell'
import { logout } from '@/app/login/actions'

const NAV_ITEMS = [
  { href: '/vendedor/dashboard', label: 'Dashboard' },
  { href: '/vendedor/produtos', label: 'Produtos' },
  { href: '/vendedor/clientes', label: 'Clientes' },
  { href: '/vendedor/vendas', label: 'Vendas' },
  { href: '/vendedor/orcamentos', label: 'Orçamentos' },
  { href: '/vendedor/taxas', label: 'Taxas' },
]

export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole('admin', 'vendedor')

  return (
    <AppShell brandLabel="JC Info · Vendedor" navItems={NAV_ITEMS} userLabel={session.fullName} logoutAction={logout}>
      {children}
    </AppShell>
  )
}
