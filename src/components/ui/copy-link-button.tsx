'use client'

import { useState } from 'react'
import { ShareIcon, CheckIcon } from './icons'

/** `path` is a site-relative path (e.g. "/pre-venda/iphone-18"); the absolute URL is resolved client-side. */
export function CopyLinkButton({ path }: { path: string }) {
  const [copied, setCopied] = useState(false)

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`)
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
      className="flex shrink-0 items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-600 transition hover:border-neutral-300 hover:text-neutral-900"
    >
      {copied ? <CheckIcon className="h-3.5 w-3.5 text-green-600" /> : <ShareIcon className="h-3.5 w-3.5" />}
      {copied ? 'Copiado' : 'Copiar link'}
    </button>
  )
}
