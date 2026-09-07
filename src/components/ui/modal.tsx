'use client'

import { useState } from 'react'
import { Button } from './button'

export function Modal({
  triggerLabel,
  title,
  children,
}: {
  triggerLabel: string
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setOpen(true)}>{triggerLabel}</Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-neutral-400 hover:text-neutral-700"
              >
                Fechar
              </button>
            </div>
            {children}
          </div>
        </div>
      )}
    </>
  )
}
