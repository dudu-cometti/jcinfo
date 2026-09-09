import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { MachineForm } from './MachineForm'
import { MachineCard } from './MachineCard'
import type { RateRuleRow } from './RateRuleTable'

export const metadata = { title: 'Taxas de cartão' }

export default async function AdminTaxasPage() {
  const supabase = await createClient()

  const [{ data: machines }, { data: rules }] = await Promise.all([
    supabase
      .from('payment_machines')
      .select('id, name, min_installments, max_installments, status')
      .order('created_at'),
    supabase
      .from('payment_rate_rules')
      .select('id, machine_id, method, installments, card_brand, percentage, fixed_value, period_start, period_end, status')
      .order('installments'),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-neutral-900">Taxas de cartão</h1>
      <p className="text-sm text-neutral-500">
        Cadastre as máquinas/adquirentes e as regras de taxa por bandeira, parcelas e período de vigência. O
        vendedor só consulta estas regras — nunca edita.
      </p>

      {(machines ?? []).map((machine) => (
        <MachineCard
          key={machine.id}
          machine={machine}
          rules={((rules ?? []) as RateRuleRow[]).filter((r) => r.machine_id === machine.id)}
        />
      ))}

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Nova máquina/adquirente</h2>
        <MachineForm />
      </Card>
    </div>
  )
}
