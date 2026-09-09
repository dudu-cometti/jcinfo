export class FreightExceedsMaxError extends Error {}

/**
 * Fast-fail check mirroring the authoritative guard inside create_orcamento()
 * (reads site_settings.freight_max_value server-side). This runs before the
 * RPC call purely for a faster/nicer error — the RPC rejects an
 * over-the-max freight regardless of whether this check ran, so a request
 * made outside the UI (or with this check skipped/bypassed) is still
 * rejected in the database.
 */
export function validateFreight(value: number, maxValue: number): void {
  if (value < 0) {
    throw new FreightExceedsMaxError('O frete não pode ser negativo.')
  }
  if (value > maxValue) {
    throw new FreightExceedsMaxError(`O frete não pode ser maior que ${maxValue.toFixed(2)}.`)
  }
}
