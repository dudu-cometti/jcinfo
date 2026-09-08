'use client'

import { useState } from 'react'
import { Select, Label } from '@/components/ui/input'
import { setHomeBannerImageSource, type HomeBannerImageSource } from '../actions'

type PreorderCampaignOption = { id: string; name: string; status: string }
type RaffleOption = { id: string; name: string; status: string }

function encode(source: HomeBannerImageSource) {
  return source ? `${source.type}:${source.id}` : ''
}

function decode(value: string): HomeBannerImageSource {
  if (!value) return null
  const [type, id] = value.split(':')
  return type === 'preorder' || type === 'raffle' ? { type, id } : null
}

export function ImageSourceSelector({
  bannerId,
  preorderCampaigns,
  raffles,
  currentSource,
}: {
  bannerId: string
  preorderCampaigns: PreorderCampaignOption[]
  raffles: RaffleOption[]
  currentSource: HomeBannerImageSource
}) {
  const [value, setValue] = useState(encode(currentSource))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = e.target.value
    setValue(newValue)
    setPending(true)
    setError(null)
    const result = await setHomeBannerImageSource(bannerId, decode(newValue))
    if (result?.error) setError(result.error)
    setPending(false)
  }

  return (
    <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <Label htmlFor="image_source" className="mb-1">
        De onde vem a imagem deste destaque?
      </Label>
      <p className="mb-2 text-xs text-neutral-500">
        &ldquo;Enviar imagem própria&rdquo; abre o upload abaixo. Escolhendo uma pré-venda ou sorteio, a imagem já
        cadastrada lá é reaproveitada aqui automaticamente, e continua se atualizando sozinha se você trocar a
        imagem depois.
      </p>
      <Select id="image_source" value={value} onChange={handleChange} disabled={pending}>
        <option value="">Enviar imagem própria</option>
        {preorderCampaigns.length > 0 && (
          <optgroup label="Pré-vendas">
            {preorderCampaigns.map((c) => (
              <option key={c.id} value={`preorder:${c.id}`}>
                {c.status === 'aberta' ? c.name : `${c.name} (${c.status})`}
              </option>
            ))}
          </optgroup>
        )}
        {raffles.length > 0 && (
          <optgroup label="Sorteios">
            {raffles.map((r) => (
              <option key={r.id} value={`raffle:${r.id}`}>
                {r.status === 'aberto' ? r.name : `${r.name} (${r.status})`}
              </option>
            ))}
          </optgroup>
        )}
      </Select>
      {pending && <p className="mt-1 text-xs text-neutral-400">Salvando...</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
