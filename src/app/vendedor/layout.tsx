import Link from 'next/link'
import { requireRole } from '@/lib/auth/dal'
import { logout } from '@/app/login/actions'

const NAV_ITEMS = [
  { href: '/vendedor/dashboard', label: 'Dashboard' },
  { href: '/vendedor/produtos', label: 'Produtos' },
  { href: '/vendedor/clientes', label: 'Clientes' },
  { href: '/vendedor/vendas', label: 'Vendas' },
]

export default async function VendedorLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole('admin', 'vendedor')

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <nav className="flex h-full w-56 shrink-0 flex-col gap-1 border-r border-neutral-200 bg-white p-4">
        <span className="mb-4 px-2 text-sm font-semibold text-neutral-900">JC Info · Vendedor</span>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
          <span className="text-sm text-neutral-500">{session.fullName}</span>
          <form action={logout}>
            <button type="submit" className="text-sm text-neutral-500 hover:text-neutral-900">
              Sair
            </button>
          </form>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
