import Link from 'next/link'
import { getSiteSettings } from '@/lib/data/settings'

const NAV_ITEMS = [
  { href: '/produtos', label: 'Produtos' },
  { href: '/campanhas', label: 'Campanhas' },
  { href: '/sorteios', label: 'Sorteios' },
]

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="text-lg font-semibold text-neutral-900">
            {settings.site_name}
          </Link>
          <nav className="flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm text-neutral-600 hover:text-neutral-900">
                {item.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50"
            >
              Entrar
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>

      <footer className="border-t border-neutral-200 bg-white py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 text-sm text-neutral-500">
          <p>
            © {new Date().getFullYear()} {settings.site_name}. Todos os direitos reservados.
          </p>
          <p>
            Ao se cadastrar, você concorda com o uso dos seus dados (nome, telefone e e-mail) apenas para
            identificação de compras e acúmulo de pontos. Solicite alteração ou exclusão dos seus dados
            entrando em contato pelo WhatsApp. Leia nossa{' '}
            <Link href="/privacidade" className="underline hover:text-neutral-700">
              política de privacidade
            </Link>
            .
          </p>
        </div>
      </footer>
    </div>
  )
}
