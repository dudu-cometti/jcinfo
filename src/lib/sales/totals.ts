export type CartLineInput = { price: number; promoPrice: number | null; quantity: number }

/**
 * Client-side PREVIEW only — the authoritative total is recomputed inside
 * register_sale()/confirm_sale() (supabase/migrations/000011_sale_functions.sql)
 * from the current products.price/promo_price, never trusted from here.
 */
export function computeCartTotals(lines: CartLineInput[], discount: number) {
  const subtotal = lines.reduce((sum, line) => sum + (line.promoPrice ?? line.price) * line.quantity, 0)
  const safeDiscount = Math.max(0, discount)
  const total = Math.max(0, subtotal - safeDiscount)
  const estimatedPoints = Math.floor(total)

  return { subtotal, discount: safeDiscount, total, estimatedPoints }
}
