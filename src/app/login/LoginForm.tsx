'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Field, Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { login } from './actions'

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center bg-neutral-50 px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex justify-center lg:justify-start">
            <Image src="/logo.jpg" alt="JC Info" width={170} height={50} priority className="h-10 w-auto" />
          </Link>

          <h1 className="text-xl font-semibold text-neutral-900">Entrar no painel</h1>
          <p className="mt-1 text-sm text-neutral-500">Acesso restrito a administradores e vendedores.</p>

          <form action={action} className="mt-6 space-y-4">
            <Field label="E-mail" htmlFor="email">
              <Input id="email" name="email" type="email" required autoComplete="email" autoFocus />
            </Field>
            <Field label="Senha" htmlFor="password">
              <Input id="password" name="password" type="password" required autoComplete="current-password" />
            </Field>

            {state?.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
            )}

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-neutral-400 lg:text-left">
            <Link href="/" className="hover:underline">
              Voltar para a loja
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-navy to-brand-teal lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-sm text-center text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-cyan">Painel administrativo</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight">Tudo o que você precisa pra tocar a loja</h2>
          <p className="mt-3 text-white/80">Vendas, estoque, pontos de fidelidade e muito mais, em um só lugar.</p>
        </div>
      </div>
    </div>
  )
}
