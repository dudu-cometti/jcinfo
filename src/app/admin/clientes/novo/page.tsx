'use client'

import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { createCustomer } from '@/lib/actions/customers'

export default function NewCustomerPage() {
  const router = useRouter()

  return (
    <Card className="max-w-lg">
      <h1 className="mb-4 text-lg font-semibold text-neutral-900">Novo cliente</h1>
      <CustomerForm
        action={createCustomer}
        submitLabel="Cadastrar cliente"
        onSuccess={(customerId) => router.push(`/admin/clientes/${customerId}`)}
      />
    </Card>
  )
}
