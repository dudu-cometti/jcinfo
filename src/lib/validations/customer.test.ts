import { describe, expect, it } from 'vitest'
import { customerSchema } from './customer'

describe('customerSchema', () => {
  it('normalizes phone formatting so duplicates are caught by the DB unique constraint', () => {
    const result = customerSchema.safeParse({
      name: 'João',
      phone: '(11) 99999-9999',
      email: '',
      notes: '',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.phone).toBe('11999999999')
  })

  it('rejects a phone that is too short even after stripping formatting', () => {
    const result = customerSchema.safeParse({ name: 'João', phone: '999', email: '', notes: '' })
    expect(result.success).toBe(false)
  })

  it('treats an empty email as absent rather than invalid', () => {
    const result = customerSchema.safeParse({
      name: 'João',
      phone: '11999999999',
      email: '',
      notes: '',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBeNull()
  })

  it('rejects a malformed email', () => {
    const result = customerSchema.safeParse({
      name: 'João',
      phone: '11999999999',
      email: 'not-an-email',
      notes: '',
    })
    expect(result.success).toBe(false)
  })
})
