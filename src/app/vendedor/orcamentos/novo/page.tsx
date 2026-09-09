import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/data/settings'
import { OrcamentoBuilder } from '@/components/orcamentos/OrcamentoBuilder'

export const metadata = { title: 'Novo orçamento' }

export default async function NovoOrcamentoPage() {
  const supabase = await createClient()
  const [{ data: machines }, settings] = await Promise.all([
    supabase
      .from('payment_machines')
      .select('id, name, min_installments, max_installments')
      .eq('status', 'ativo')
      .order('created_at'),
    getSiteSettings(),
  ])

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-neutral-900">Novo orçamento</h1>
      <OrcamentoBuilder
        machines={machines ?? []}
        defaultFreight={settings.freight_default_value}
        maxFreight={settings.freight_max_value}
        defaultValidityDays={settings.orcamento_default_validity_days}
      />
    </div>
  )
}
