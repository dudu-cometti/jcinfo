'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { loginCustomer } from './actions'

export default function CustomerLoginPage() {
  const [state, action, pending] = useActionState(loginCustomer, undefined)

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">Entrar</h1>
        <p className="mt-1 text-sm text-neutral-500">Acesse sua conta para ver seus pontos e compras.</p>

        <form action={action} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-neutral-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {pending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-neutral-500">
          Ainda não tem conta?{' '}
          <Link href="/cliente/cadastro" className="font-medium text-brand-navy hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
