'use client'

import { useActionState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Field, Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { loginCustomer } from './actions'

export function LoginForm() {
  const [state, action, pending] = useActionState(loginCustomer, undefined)

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center bg-neutral-50 px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex justify-center lg:justify-start">
            <Image src="/logo.jpg" alt="JC Info" width={170} height={50} priority className="h-10 w-auto" />
          </Link>

          <Link
            href="/produtos"
            className="mb-6 flex w-full items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
          >
            Ver produtos
          </Link>

          <h1 className="text-xl font-semibold text-neutral-900">Entrar</h1>
          <p className="mt-1 text-sm text-neutral-500">Acesse sua conta para ver seus pontos e compras.</p>

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

          <p className="mt-4 text-center text-sm text-neutral-500 lg:text-left">
            Ainda não tem conta?{' '}
            <Link href="/cliente/cadastro" className="font-medium text-brand-navy hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-brand-navy to-brand-teal lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="max-w-sm text-center text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-cyan">Sua conta JC Info</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight">Acompanhe seus pontos e suas compras</h2>
          <p className="mt-3 text-white/80">
            Veja seu ranking, participe de sorteios e garanta sua vaga nas pré-vendas antes de todo mundo.
          </p>
        </div>
      </div>
    </div>
  )
}
