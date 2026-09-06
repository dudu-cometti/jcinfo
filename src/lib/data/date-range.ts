export type DateRangeKey = 'hoje' | 'ontem' | '7d' | 'mes_atual' | 'mes_anterior' | 'personalizado'

export const DATE_RANGE_OPTIONS: { value: DateRangeKey; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'ontem', label: 'Ontem' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: 'mes_atual', label: 'Mês atual' },
  { value: 'mes_anterior', label: 'Mês anterior' },
  { value: 'personalizado', label: 'Personalizado' },
]

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function resolveDateRange(
  key: DateRangeKey | undefined,
  from?: string,
  to?: string,
): { start: Date; end: Date; key: DateRangeKey } {
  const now = new Date()

  if (key === 'personalizado' && from && to) {
    return { start: startOfDay(new Date(from)), end: endOfDay(new Date(to)), key }
  }

  switch (key) {
    case 'ontem': {
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      return { start: startOfDay(yesterday), end: endOfDay(yesterday), key }
    }
    case '7d': {
      const start = new Date(now)
      start.setDate(start.getDate() - 6)
      return { start: startOfDay(start), end: endOfDay(now), key }
    }
    case 'mes_atual': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: startOfDay(start), end: endOfDay(now), key }
    }
    case 'mes_anterior': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const end = new Date(now.getFullYear(), now.getMonth(), 0)
      return { start: startOfDay(start), end: endOfDay(end), key }
    }
    case 'hoje':
    default:
      return { start: startOfDay(now), end: endOfDay(now), key: 'hoje' }
  }
}
