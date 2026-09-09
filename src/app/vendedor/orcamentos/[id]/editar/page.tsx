import { notFound } from 'next/navigation'
import { requireRole } from '@/lib/auth/dal'
import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/data/settings'
import { getOrcamento } from '@/lib/data/orcamentos'
import { OrcamentoBuilder, type EditOrcamentoData } from '@/components/orcamentos/OrcamentoBuilder'

export const metadata = { title: 'Editar orçamento' }

export default async function EditarOrcamentoPage({ params }: PageProps<'/vendedor/orcamentos/[id]/editar'>) {
  const { id } = await params
  const session = await requireRole('admin', 'vendedor')

  const result = await getOrcamento(session, id)
  if (!result) notFound()
  const { orcamento, items } = result

  // Imutável fora de rascunho — nem a tela de edição abre.
  if (orcamento.status !== 'rascunho') notFound()

  const supabase = await createClient()
  const [{ data: machines }, settings] = await Promise.all([
    supabase
      .from('payment_machines')
      .select('id, name, min_installments, max_installments')
      .eq('status', 'ativo')
      .order('created_at'),
    getSiteSettings(),
  ])

  const productIds = [...new Set(items.map((item) => item.product_id).filter((id): id is string => Boolean(id)))]
  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku, price, promo_price, stock, status, variants:product_variants(id, color_name, price, promo_price, stock, status)')
    .in('id', productIds.length > 0 ? productIds : ['00000000-0000-0000-0000-000000000000'])

  type LiveProduct = {
    id: string
    name: string
    sku: string | null
    price: number
    promo_price: number | null
    stock: number
    status: string
    variants: { id: string; color_name: string; price: number; promo_price: number | null; stock: number; status: string }[]
  }
  const productsById = new Map(((products ?? []) as unknown as LiveProduct[]).map((p) => [p.id, p]))

  const initialCart = items.flatMap((item) => {
    const product = item.product_id ? productsById.get(item.product_id) : undefined
    if (!product) return []
    const variant = item.variant_id ? product.variants.find((v) => v.id === item.variant_id) ?? null : null
    return [
      {
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          promo_price: product.promo_price,
          stock: product.stock,
          variants: product.variants,
        },
        variant,
        quantity: item.quantity,
      },
    ]
  })

  const editOrcamento: EditOrcamentoData = {
    orcamentoId: orcamento.id,
    customerName: orcamento.customer_name_snapshot,
    initialCart,
    discount: orcamento.discount,
    freightValue: orcamento.freight_value,
    machineId: orcamento.machine_id ?? machines?.[0]?.id ?? '',
    method: orcamento.payment_method ?? 'pix',
    cardBrand: orcamento.card_brand_snapshot ?? '',
    installments: orcamento.installments,
    validityDays: orcamento.validity_days,
    notes: orcamento.notes ?? '',
  }

  return (
    <div>
      <h1 className="mb-6 text-lg font-semibold text-neutral-900">Editar orçamento</h1>
      <OrcamentoBuilder
        machines={machines ?? []}
        defaultFreight={settings.freight_default_value}
        maxFreight={settings.freight_max_value}
        defaultValidityDays={settings.orcamento_default_validity_days}
        editOrcamento={editOrcamento}
      />
    </div>
  )
}
