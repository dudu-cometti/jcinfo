'use client'

import { useState } from 'react'
import Link from 'next/link'

export type NavItem = { href: string; label: string }

export function AppShell({
  brandLabel,
  navItems,
  userLabel,
  logoutAction,
  children,
}: {
  brandLabel: string
  navItems: NavItem[]
  userLabel: string
  logoutAction: () => Promise<void>
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-neutral-50">
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <nav
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col gap-1 overflow-y-auto border-r border-neutral-200 bg-white p-4 transition-transform duration-200 md:relative md:z-auto md:w-60 md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mb-4 flex items-center justify-between px-2">
          <span className="text-sm font-semibold text-neutral-900">{brandLabel}</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-neutral-400 hover:text-neutral-700 md:hidden"
            aria-label="Fechar menu"
          >
            Fechar
          </button>
        </div>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex flex-col gap-1 md:hidden"
            aria-label="Abrir menu"
          >
            <span className="block h-0.5 w-5 bg-neutral-700" />
            <span className="block h-0.5 w-5 bg-neutral-700" />
            <span className="block h-0.5 w-5 bg-neutral-700" />
          </button>
          <span className="truncate text-sm text-neutral-500">{userLabel}</span>
          <form action={logoutAction}>
            <button type="submit" className="shrink-0 text-sm text-neutral-500 hover:text-neutral-900">
              Sair
            </button>
          </form>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
