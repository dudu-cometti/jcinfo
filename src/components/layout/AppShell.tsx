'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type NavLeaf = { href: string; label: string; external?: boolean }
export type NavGroup = { label: string; items: NavLeaf[] }
export type NavEntry = NavLeaf | NavGroup

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry
}

function NavLink({ item, onNavigate }: { item: NavLeaf; onNavigate: () => void }) {
  const pathname = usePathname()
  const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`)
  const className = `rounded-lg px-3 py-2 text-sm transition ${
    isActive
      ? 'bg-brand-navy/10 font-medium text-brand-navy'
      : 'text-neutral-600 hover:bg-brand-navy/5 hover:text-brand-navy'
  }`

  // /simulador (and anything else marked external) is a standalone public
  // page with no shell of its own — open it in a new tab so staff don't
  // lose whatever they were doing in the admin/vendedor panel.
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={className}>
        {item.label}
      </a>
    )
  }

  return (
    <Link href={item.href} onClick={onNavigate} className={className}>
      {item.label}
    </Link>
  )
}

function NavGroupSection({ group, onNavigate }: { group: NavGroup; onNavigate: () => void }) {
  const pathname = usePathname()
  const isActive = group.items.some((item) => pathname === item.href || pathname?.startsWith(`${item.href}/`))
  const [open, setOpen] = useState(isActive)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-brand-navy/5 ${
          isActive ? 'text-brand-navy' : 'text-neutral-500 hover:text-brand-navy'
        }`}
      >
        {group.label}
        <span className={`text-xs transition-transform ${open ? 'rotate-90' : ''}`}>{'>'}</span>
      </button>
      {open && (
        <div className="ml-2 flex flex-col gap-1 border-l border-neutral-200 pl-2">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  )
}

export function AppShell({
  brandLabel,
  navItems,
  userLabel,
  logoutAction,
  children,
}: {
  brandLabel: string
  navItems: NavEntry[]
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
          <span className="text-sm font-semibold text-brand-navy">{brandLabel}</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-neutral-400 hover:text-neutral-700 md:hidden"
            aria-label="Fechar menu"
          >
            Fechar
          </button>
        </div>
        {navItems.map((entry) =>
          isGroup(entry) ? (
            <NavGroupSection key={entry.label} group={entry} onNavigate={() => setOpen(false)} />
          ) : (
            <NavLink key={entry.href} item={entry} onNavigate={() => setOpen(false)} />
          ),
        )}
      </nav>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex flex-col gap-1 md:hidden"
            aria-label="Abrir menu"
          >
            <span className="block h-0.5 w-5 bg-brand-navy" />
            <span className="block h-0.5 w-5 bg-brand-navy" />
            <span className="block h-0.5 w-5 bg-brand-navy" />
          </button>
          <span className="truncate text-sm text-neutral-500">{userLabel}</span>
          <form action={logoutAction}>
            <button type="submit" className="shrink-0 text-sm text-neutral-500 hover:text-brand-navy">
              Sair
            </button>
          </form>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
