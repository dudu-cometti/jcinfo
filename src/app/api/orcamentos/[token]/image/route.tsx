import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { getSiteSettings } from '@/lib/data/settings'
import { checkOrcamentoImageRateLimit, getClientIp } from '@/lib/security/rate-limit'
import { buildShareImageElement, getLogoDataUri, type ShareImageSnapshot } from '@/lib/orcamentos/share-image'

export const runtime = 'nodejs'

export async function GET(_request: Request, context: RouteContext<'/api/orcamentos/[token]/image'>) {
  const { token } = await context.params

  const ip = await getClientIp()
  const allowed = await checkOrcamentoImageRateLimit(ip)
  if (!allowed) {
    return new Response('Too many requests', { status: 429 })
  }

  const supabase = await createClient()

  const { data: snapshotRows } = await supabase.rpc('get_orcamento_snapshot_by_token', { p_token: token })
  const snapshot = snapshotRows?.[0]
  if (!snapshot) {
    return new Response('Not found', { status: 404 })
  }

  const { data: itemRows } = await supabase.rpc('get_orcamento_items_by_token', { p_token: token })
  const settings = await getSiteSettings()
  const logoSrc = await getLogoDataUri()

  const data: ShareImageSnapshot = {
    orcamentoId: snapshot.orcamento_id,
    customerFirstName: snapshot.customer_name_snapshot.split(' ')[0] ?? snapshot.customer_name_snapshot,
    createdAt: snapshot.created_at,
    expiresAt: snapshot.expires_at,
    subtotal: snapshot.subtotal,
    discount: snapshot.discount,
    freightValue: snapshot.freight_value,
    finalValue: snapshot.final_value,
    machineName: snapshot.machine_name_snapshot,
    paymentMethod: snapshot.payment_method,
    installments: snapshot.installments,
    installmentValue: snapshot.installment_value,
    lastInstallmentValue: snapshot.last_installment_value,
    items: (itemRows ?? []).map(
      (item: {
        product_name_snapshot: string
        variant_color_snapshot: string | null
        image_url_snapshot: string | null
        quantity: number
        subtotal_snapshot: number
      }) => ({
        productName: item.product_name_snapshot,
        variantColor: item.variant_color_snapshot,
        imageUrl: item.image_url_snapshot,
        quantity: item.quantity,
        subtotal: item.subtotal_snapshot,
      }),
    ),
    warrantyText: settings.store_warranty_text,
    storeAddress: settings.store_address,
    whatsappNumber: settings.whatsapp_number,
  }

  return new ImageResponse(buildShareImageElement(data, logoSrc), {
    width: 1080,
    height: 1920,
  })
}
