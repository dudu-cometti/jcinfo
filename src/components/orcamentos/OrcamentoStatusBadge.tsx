import { Badge } from '@/components/ui/badge'

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  enviado: 'Enviado',
  aprovado: 'Aprovado',
  expirado: 'Expirado',
  convertido: 'Convertido',
  cancelado: 'Cancelado',
}

const STATUS_TONES: Record<string, 'neutral' | 'green' | 'red' | 'yellow' | 'blue'> = {
  rascunho: 'neutral',
  enviado: 'blue',
  aprovado: 'yellow',
  expirado: 'red',
  convertido: 'green',
  cancelado: 'red',
}

export function OrcamentoStatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONES[status] ?? 'neutral'}>{STATUS_LABELS[status] ?? status}</Badge>
}
