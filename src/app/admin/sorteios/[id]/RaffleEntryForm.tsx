'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { addRaffleEntry } from '@/lib/actions/raffles'

type Customer = { id: string; name: string; phone: string }

export function RaffleEntryForm({ raffleId }: { raffleId: string }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Customer[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (query.trim().length < 2) {
        setResults([])
        return
      }
      fetch(`/api/customers/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => setResults(data.customers ?? []))
        .catch(() => setResults([]))
    }, 250)
    return () => clearTimeout(timeout)
  }, [query])

  function add(customerId: string) {
    setError(null)
    startTransition(async () => {
      const result = await addRaffleEntry(raffleId, customerId)
      if (result?.error) {
        setError(result.error)
        return
      }
      setQuery('')
      setResults([])
      router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <Input
        placeholder="Buscar cliente para adicionar..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        disabled={isPending}
      />
      {results.length > 0 && (
        <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200">
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => add(c.id)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-neutral-50"
              >
                <span>{c.name}</span>
                <span className="text-neutral-400">{c.phone}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
