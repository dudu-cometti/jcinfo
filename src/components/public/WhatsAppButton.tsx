'use client'

import { useRef, useState } from 'react'
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
  className,
}: {
  whatsappNumber: string
  productId: string
  productName: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const popupRef = useRef<Window | null>(null)

  if (!whatsappNumber) return null

  function openForm() {
    // Opened synchronously on the click so it isn't blocked as a popup once
    // the async lead-creation below resolves and sets its location.
    popupRef.current = window.open('', '_blank')
    setOpen(true)
  }

  function closeForm() {
    popupRef.current?.close()
    popupRef.current = null
    setOpen(false)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)

    const formData = new FormData()
    formData.set('name', name)
    formData.set('phone', phone)
    const result = await createLead(undefined, formData)

    if (result?.error) {
      setError(result.error)
      setPending(false)
      return
    }

    pushDataLayer({ event: 'lead', product_id: productId, product_name: productName })
    pushDataLayer({ event: 'contact_whatsapp', product_id: productId, product_name: productName })

    const message = encodeURIComponent(`Olá, meu nome é ${name}. Tenho interesse no produto ${productName}.`)
    const href = `https://wa.me/${whatsappNumber}?text=${message}`

    if (popupRef.current) {
      popupRef.current.location.href = href
    } else {
      window.location.href = href
    }

    setPending(false)
    setOpen(false)
    setName('')
    setPhone('')
  }

  return (
    <>
      <button
        type="button"
        onClick={openForm}
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

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 pt-1">
                <Button type="submit" disabled={pending} className="flex-1 bg-green-600 hover:bg-green-700">
                  {pending ? 'Abrindo...' : 'Continuar para o WhatsApp'}
                </Button>
                <Button type="button" variant="ghost" onClick={closeForm} disabled={pending}>
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
