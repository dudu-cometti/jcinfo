'use client'

import { useState } from 'react'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/produtos', label: 'Produtos' },
  { href: '/pre-venda', label: 'Pré-vendas' },
  { href: '/campanhas', label: 'Campanhas' },
  { href: '/sorteios', label: 'Sorteios' },
]

export function PublicNav({ customerName }: { customerName: string | null }) {
  const [open, setOpen] = useState(false)
  const accountHref = customerName ? '/cliente/dashboard' : '/cliente/login'
  const accountLabel = customerName ? customerName.split(' ')[0] : 'Minha conta'

  return (
    <div className="relative">
      <div className="flex items-center gap-2 sm:hidden">
        <Link
          href={accountHref}
          className="max-w-[7rem] truncate rounded-lg border border-brand-navy/30 px-3 py-1.5 text-sm text-brand-navy hover:bg-brand-navy/5"
        >
          {accountLabel}
        </Link>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menu"
          className="flex flex-col gap-1 p-2"
        >
          <span className="block h-0.5 w-5 bg-neutral-700" />
          <span className="block h-0.5 w-5 bg-neutral-700" />
          <span className="block h-0.5 w-5 bg-neutral-700" />
        </button>
      </div>

      <nav className="hidden items-center gap-6 sm:flex">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className="text-sm text-neutral-600 hover:text-brand-navy">
            {item.label}
          </Link>
        ))}
        <Link
          href={accountHref}
          className="max-w-[10rem] truncate rounded-lg border border-brand-navy/30 px-3 py-1.5 text-sm text-brand-navy hover:bg-brand-navy/5"
        >
          {accountLabel}
        </Link>
      </nav>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg sm:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
