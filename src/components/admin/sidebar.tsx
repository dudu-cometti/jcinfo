import Link from 'next/link'

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

export function AdminSidebar() {
  return (
    <nav className="flex h-full w-60 shrink-0 flex-col gap-1 border-r border-neutral-200 bg-white p-4">
      <span className="mb-4 px-2 text-sm font-semibold text-neutral-900">
        JC Info · Admin
      </span>
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
  )
}
