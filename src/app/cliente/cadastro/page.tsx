'use client'

import Link from 'next/link'
import { useActionState, useState } from 'react'
import { PhoneInput } from '@/components/ui/phone-input'
import { CpfInput } from '@/components/ui/cpf-input'
import { registerCustomer } from './actions'

export default function CustomerRegisterPage() {
  const [state, action, pending] = useActionState(registerCustomer, undefined)
  const [phone, setPhone] = useState('')
  const [cpf, setCpf] = useState('')

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-neutral-900">Criar conta</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Acompanhe seus pontos, compras e pré-vendas em um só lugar.
        </p>

        <form action={action} className="mt-6 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-neutral-700">
              Nome completo
            </label>
            <input
              id="name"
              name="name"
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-neutral-700">
              Telefone
            </label>
            <PhoneInput id="phone" name="phone" required value={phone} onChange={setPhone} />
          </div>

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
            <label htmlFor="cpf" className="mb-1 block text-sm font-medium text-neutral-700">
              CPF
            </label>
            <CpfInput id="cpf" name="cpf" required value={cpf} onChange={setCpf} />
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
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700">
              Confirmar senha
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
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
            {pending ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-neutral-500">
          Já tem conta?{' '}
          <Link href="/cliente/login" className="font-medium text-brand-navy hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
