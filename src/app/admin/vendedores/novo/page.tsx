'use client'

import { useActionState } from 'react'
import { Card } from '@/components/ui/card'
import { Field, Input, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { createSeller } from '@/lib/actions/sellers'

export default function NewSellerPage() {
  const [state, formAction, pending] = useActionState(createSeller, undefined)

  return (
    <Card className="max-w-lg">
      <h1 className="mb-4 text-lg font-semibold text-neutral-900">Novo usuário</h1>
      <form action={formAction} className="space-y-4">
        <Field label="Nome completo" htmlFor="full_name">
          <Input id="full_name" name="full_name" required />
        </Field>
        <Field label="E-mail" htmlFor="email">
          <Input id="email" name="email" type="email" required />
        </Field>
        <Field label="Senha provisória" htmlFor="password" hint="O usuário poderá trocar depois pelo fluxo de recuperação de senha">
          <Input id="password" name="password" type="password" required minLength={6} />
        </Field>
        <Field label="Função" htmlFor="role">
          <Select id="role" name="role" defaultValue="vendedor">
            <option value="vendedor">Vendedor</option>
            <option value="admin">Administrador</option>
          </Select>
        </Field>

        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? 'Criando...' : 'Criar usuário'}
        </Button>
      </form>
    </Card>
  )
}
