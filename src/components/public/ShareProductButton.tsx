'use client'

import { useState } from 'react'
import { ShareIcon, CheckIcon } from '@/components/ui/icons'

export function ShareProductButton() {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access denied or unavailable — nothing sensible to fall back to.
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex shrink-0 items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
      aria-label="Copiar link do produto"
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5 text-green-600" /> : <ShareIcon className="h-3.5 w-3.5" />}
      {copied ? 'Link copiado' : 'Compartilhar'}
    </button>
  )
}
