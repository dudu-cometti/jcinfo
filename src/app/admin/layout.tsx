import { requireRole } from '@/lib/auth/dal'
import { AdminSidebar } from '@/components/admin/sidebar'
import { logout } from '@/app/login/actions'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await requireRole('admin')

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-3">
          <span className="text-sm text-neutral-500">{session.fullName}</span>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-neutral-500 hover:text-neutral-900"
            >
              Sair
            </button>
          </form>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
