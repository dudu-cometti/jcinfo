'use client'

import { useTransition } from 'react'
import { Select } from '@/components/ui/input'
import { setSellerActive, setSellerRole } from '@/lib/actions/sellers'

export function SellerRowActions({
  profileId,
  role,
  active,
}: {
  profileId: string
  role: 'admin' | 'vendedor'
  active: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center justify-end gap-3">
      <Select
        value={role}
        disabled={isPending}
        onChange={(e) => startTransition(() => setSellerRole(profileId, e.target.value as 'admin' | 'vendedor'))}
        className="w-28 py-1 text-xs"
      >
        <option value="admin">Admin</option>
        <option value="vendedor">Vendedor</option>
      </Select>
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(() => setSellerActive(profileId, !active))}
        className="text-sm text-neutral-600 hover:underline disabled:opacity-50"
      >
        {active ? 'Desativar' : 'Reativar'}
      </button>
    </div>
  )
}
