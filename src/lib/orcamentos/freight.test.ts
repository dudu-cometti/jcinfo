import { describe, expect, it } from 'vitest'
import { validateFreight, FreightExceedsMaxError } from './freight'

describe('validateFreight', () => {
  it('accepts a freight value within the configured max', () => {
    expect(() => validateFreight(140, 300)).not.toThrow()
  })

  it('accepts a freight value exactly at the max', () => {
    expect(() => validateFreight(300, 300)).not.toThrow()
  })

  it('rejects a freight value above the configured max', () => {
    expect(() => validateFreight(301, 300)).toThrow(FreightExceedsMaxError)
  })

  it('rejects a negative freight value', () => {
    expect(() => validateFreight(-1, 300)).toThrow(FreightExceedsMaxError)
  })
})
