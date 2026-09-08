'use client'

import { useCallback, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Button } from './button'
import { getCroppedImageBlob } from '@/lib/image-crop'

export function ImageCropModal({
  imageSrc,
  aspect = 1,
  onCancel,
  onConfirm,
}: {
  imageSrc: string
  aspect?: number
  onCancel: () => void
  onConfirm: (blob: Blob) => void | Promise<void>
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels)
  }, [])

  async function handleConfirm() {
    if (!croppedArea) return
    setPending(true)
    setError(null)
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedArea)
      await onConfirm(blob)
    } catch {
      setError('Erro ao cortar a imagem. Tente novamente.')
      setPending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90">
      <div className="relative flex-1">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>
      <div className="space-y-3 bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-500">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={pending}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={pending || !croppedArea}>
            {pending ? 'Salvando...' : 'Cortar e salvar'}
          </Button>
        </div>
      </div>
    </div>
  )
}
