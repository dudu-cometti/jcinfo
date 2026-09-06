'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatBRL } from '@/lib/utils'

type Summary = { name: string; points: number; total_spent: number; rank: number }

export default function ClienteDashboardPage() {
  const [phone, setPhone] = useState('')
  const [summary, setSummary] = useState<Summary | null | 'not_found'>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSummary(null)
    const { data } = await createClient().rpc('get_customer_summary', { p_phone: phone })
    setSummary(data && data.length > 0 ? data[0] : 'not_found')
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Meus pontos</h1>
        <p className="mt-1 text-sm text-neutral-500">Informe seu telefone cadastrado para consultar seus pontos.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Buscando...' : 'Consultar'}
          </Button>
        </form>

        {summary === 'not_found' && (
          <p className="mt-4 text-sm text-red-600">Nenhum cliente encontrado com esse telefone.</p>
        )}

        {summary && summary !== 'not_found' && (
          <div className="mt-6 space-y-3 text-center">
            <p className="text-lg font-medium text-neutral-900">Olá, {summary.name}!</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-2xl font-semibold">{summary.points.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-neutral-500">pontos</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">#{summary.rank}</p>
                <p className="text-xs text-neutral-500">ranking</p>
              </div>
              <div>
                <p className="text-2xl font-semibold">{formatBRL(summary.total_spent)}</p>
                <p className="text-xs text-neutral-500">comprado</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="flex justify-center gap-4 text-sm text-neutral-500">
        <Link href="/campanhas" className="hover:underline">
          Campanhas de pontos
        </Link>
        <Link href="/sorteios" className="hover:underline">
          Sorteios
        </Link>
      </div>
    </div>
  )
}
