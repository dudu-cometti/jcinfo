'use client'

import { createClient } from '@/lib/supabase/client'

export function WhatsAppButton({
  whatsappNumber,
  productId,
  productName,
  className,
}: {
  whatsappNumber: string
  productId: string
  productName: string
  className?: string
}) {
  const message = encodeURIComponent(`Olá, tenho interesse no produto ${productName}.`)
  const href = whatsappNumber ? `https://wa.me/${whatsappNumber}?text=${message}` : undefined

  function handleClick() {
    if (typeof window !== 'undefined' && 'dataLayer' in window) {
      ;(window as unknown as { dataLayer: unknown[] }).dataLayer.push({
        event: 'contact_whatsapp',
        product_id: productId,
        product_name: productName,
      })
    }
    createClient()
      .rpc('log_audit', {
        p_action: 'whatsapp_click',
        p_resource_table: 'products',
        p_resource_id: productId,
        p_data: { product_name: productName },
      })
      .then(() => {})
  }

  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={
        className ??
        'inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700'
      }
    >
      Falar no WhatsApp
    </a>
  )
}
