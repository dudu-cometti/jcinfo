import { describe, expect, it } from 'vitest'
import { campaignSchema } from './campaign'

const base = {
  name: 'Junte pontos',
  description: '',
  min_points: '10000',
  status: 'ativa' as const,
  featured: false,
}

describe('campaignSchema', () => {
  it('accepts an end date after the start date', () => {
    const result = campaignSchema.safeParse({
      ...base,
      start_date: '2026-01-01T00:00',
      end_date: '2026-03-01T00:00',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an end date before or equal to the start date', () => {
    expect(
      campaignSchema.safeParse({ ...base, start_date: '2026-03-01T00:00', end_date: '2026-01-01T00:00' }).success,
    ).toBe(false)
    expect(
      campaignSchema.safeParse({ ...base, start_date: '2026-03-01T00:00', end_date: '2026-03-01T00:00' }).success,
    ).toBe(false)
  })
})
