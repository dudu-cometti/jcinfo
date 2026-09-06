'use client'

import { useTransition } from 'react'
import { Select } from '@/components/ui/input'
import { updateCommissionStatus } from '@/lib/actions/commissions'

const STATUSES = ['pendente', 'aprovada', 'paga', 'cancelada']

export function CommissionStatusSelect({ commissionId, status }: { commissionId: string; status: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <Select
      value={status}
      disabled={isPending}
      onChange={(e) => startTransition(() => updateCommissionStatus(commissionId, e.target.value))}
      className="py-1 text-xs"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </Select>
  )
}
