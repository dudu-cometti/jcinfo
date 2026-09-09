import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { StockReceiptForm } from './StockReceiptForm'

export const metadata = { title: 'Nova entrada de estoque' }

export default async function NovaEntradaPage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, sku, variants:product_variants(id, color_name, status)')
    .eq('status', 'ativo')
    .order('name')

  type Row = { id: string; name: string; sku: string | null; variants: { id: string; color_name: string; status: string }[] }
  const productsWithVariants = ((products ?? []) as unknown as Row[]).map((p) => ({
    ...p,
    variants: p.variants.filter((v) => v.status === 'ativo'),
  }))

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-lg font-semibold text-neutral-900">Nova entrada de estoque</h1>
      <Card>
        <StockReceiptForm products={productsWithVariants} />
      </Card>
    </div>
  )
}
