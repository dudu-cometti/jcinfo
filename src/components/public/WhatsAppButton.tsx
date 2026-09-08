'use client'

import { useState } from 'react'
import { Field, Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/phone-input'
import { Button } from '@/components/ui/button'
import { createLead } from '@/lib/actions/leads'

function pushDataLayer(event: Record<string, unknown>) {
  if (typeof window !== 'undefined' && 'dataLayer' in window) {
    ;(window as unknown as { dataLayer: unknown[] }).dataLayer.push(event)
  }
}

export function WhatsAppButton({
  whatsappNumber,
  productId,
  productName,
  knownCustomer,
  className,
}: {
  whatsappNumber: string
  productId: string
  productName: string
  /** When the visitor is a logged-in customer, skip asking for name/phone again. */
  knownCustomer?: { name: string; phone: string } | null
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  if (!whatsappNumber) return null

  function sendToWhatsApp(customerName: string, customerPhone: string) {
    const message = encodeURIComponent(`Olá, meu nome é ${customerName}. Tenho interesse no produto ${productName}.`)
    const href = `https://wa.me/${whatsappNumber}?text=${message}`

    // Navigate immediately, synchronously, inside the click/submit gesture —
    // never block the WhatsApp handoff on a network round-trip. A popup
    // opened (or a redirect fired) after an `await` gets silently
    // blocked/dropped on most mobile browsers once the original user-gesture
    // window has passed, which is what caused the blank-tab bug here before.
    window.open(href, '_blank', 'noopener,noreferrer')

    // Lead capture is best-effort and happens in the background: if it
    // fails, the visitor still reaches the seller on WhatsApp, which
    // matters far more than a perfectly recorded lead row. For a known
    // customer this just matches their existing record (createLead
    // finds-or-creates by phone), so it's safe to always call.
    const formData = new FormData()
    formData.set('name', customerName)
    formData.set('phone', customerPhone)
    createLead(undefined, formData)
      .then((result) => {
        if (result?.error) return
        pushDataLayer({ event: 'lead', product_id: productId, product_name: productName })
        pushDataLayer({ event: 'contact_whatsapp', product_id: productId, product_name: productName })
      })
      .catch(() => {})
  }

  function handleClick() {
    if (knownCustomer) {
      sendToWhatsApp(knownCustomer.name, knownCustomer.phone)
      return
    }
    setOpen(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendToWhatsApp(name, phone)
    setOpen(false)
    setName('')
    setPhone('')
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          className ??
          'inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-green-700'
        }
      >
        Falar no WhatsApp
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-neutral-900">Antes de continuar</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Informe seu nome e telefone para o vendedor já te atender identificado.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <Field label="Nome" htmlFor="lead-name">
                <Input
                  id="lead-name"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field label="Telefone" htmlFor="lead-phone">
                <PhoneInput id="lead-phone" required value={phone} onChange={setPhone} />
              </Field>

              <div className="flex gap-2 pt-1">
                <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                  Continuar para o WhatsApp
                </Button>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
