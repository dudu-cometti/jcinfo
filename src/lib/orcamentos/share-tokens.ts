import 'server-only'
import { randomBytes } from 'node:crypto'

/** 32-char URL-safe random token — not the orçamento's UUID, not guessable/sequential. */
export function generateShareToken(): string {
  return randomBytes(24).toString('base64url')
}
