import { requireRole } from '@/lib/auth/dal'
import { AppShell, type NavEntry } from '@/components/layout/AppShell'
import { logout } from '@/app/login/actions'

const BASE_NAV_ITEMS: NavEntry[] = [
  { href: '/vendedor/dashboard', label: 'Dashboard' },
  { href: '/vendedor/produtos', label: 'Produtos' },
  { href: '/vendedor/clientes', label: 'Clientes' },
  { href: '/vendedor/vendas', label: 'Vendas' },
  { href: '/vendedor/orcamentos', label: 'Orçamentos' },
  { href: '/vendedor/taxas', label: 'Taxas' },
  { href: '/simulador', label: 'Simulador', external: true },
]

export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole('admin', 'vendedor')

  // Admin can browse the vendedor-facing pages too (to see what a seller
  // sees), but this shell's nav has no other link back to /admin/* — without
  // this, an admin who navigates here has no way back except typing the URL.
  const navItems: NavEntry[] =
    session.role === 'admin'
      ? [{ href: '/admin/dashboard', label: '← Voltar para o Admin' }, ...BASE_NAV_ITEMS]
      : BASE_NAV_ITEMS

  return (
    <AppShell brandLabel="JC Info · Vendedor" navItems={navItems} userLabel={session.fullName} logoutAction={logout}>
      {children}
    </AppShell>
  )
}
