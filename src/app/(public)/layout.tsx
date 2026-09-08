import Link from 'next/link'
import Image from 'next/image'
import { getSiteSettings } from '@/lib/data/settings'
import { verifyCustomerSession } from '@/lib/auth/customer-dal'
import { PublicNav } from '@/components/public/PublicNav'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [settings, customerSession] = await Promise.all([getSiteSettings(), verifyCustomerSession()])

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center">
            <Image src="/logo.jpg" alt={settings.site_name} width={170} height={50} priority className="h-10 w-auto" />
          </Link>
          <PublicNav customerName={customerSession?.name ?? null} />
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
            <Link href="/privacidade" className="text-brand-navy underline hover:text-brand-teal">
              política de privacidade
            </Link>
            .
          </p>
          <p>
            <Link href="/login" className="hover:underline">
              Acesso da equipe
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
