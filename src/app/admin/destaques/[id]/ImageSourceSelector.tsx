'use client'

import { useState } from 'react'
import { Select, Label } from '@/components/ui/input'
import { setHomeBannerPreorderCampaign } from '../actions'

type PreorderCampaignOption = { id: string; name: string; status: string }

export function ImageSourceSelector({
  bannerId,
  preorderCampaigns,
  currentCampaignId,
}: {
  bannerId: string
  preorderCampaigns: PreorderCampaignOption[]
  currentCampaignId: string | null
}) {
  const [value, setValue] = useState(currentCampaignId ?? '')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newValue = e.target.value
    setValue(newValue)
    setPending(true)
    setError(null)
    const result = await setHomeBannerPreorderCampaign(bannerId, newValue || null)
    if (result?.error) setError(result.error)
    setPending(false)
  }

  return (
    <div className="mb-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <Label htmlFor="image_source" className="mb-1">
        De onde vem a imagem deste destaque?
      </Label>
      <p className="mb-2 text-xs text-neutral-500">
        &ldquo;Enviar imagem própria&rdquo; abre o upload abaixo. Escolhendo uma pré-venda, a imagem já cadastrada nela é
        reaproveitada aqui automaticamente, e continua se atualizando sozinha se você trocar a imagem lá depois.
      </p>
      <Select id="image_source" value={value} onChange={handleChange} disabled={pending}>
        <option value="">Enviar imagem própria</option>
        {preorderCampaigns.map((c) => (
          <option key={c.id} value={c.id}>
            Usar imagem da pré-venda: {c.status === 'aberta' ? c.name : `${c.name} (${c.status})`}
          </option>
        ))}
      </Select>
      {pending && <p className="mt-1 text-xs text-neutral-400">Salvando...</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
