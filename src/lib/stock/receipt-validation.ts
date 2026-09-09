export type ReceiptItemInput = { product_id: string; variant_id?: string | null; quantity: number; unit_cost: number }

/** product_id -> ids of its own variants. */
export type ProductVariantMap = Record<string, string[]>

export class InvalidReceiptItemError extends Error {}

/**
 * App-layer defense-in-depth mirroring receive_stock()'s DB-level guard
 * (supabase/migrations/20260101000046_receive_stock_variant_ownership_fix.sql):
 * a variant_id must belong to the product_id it's paired with, a product
 * with variants must have one selected, and a product without variants
 * must not receive one. This runs before the RPC call for a fast, clear
 * error — the RPC re-validates the same thing at the database level
 * regardless, so a request made outside the UI is still rejected there.
 */
export function validateReceiptItems(items: ReceiptItemInput[], variantsByProduct: ProductVariantMap): void {
  for (const item of items) {
    const variantIds = variantsByProduct[item.product_id] ?? []

    if (item.variant_id) {
      if (!variantIds.includes(item.variant_id)) {
        throw new InvalidReceiptItemError('A variante informada não pertence ao produto selecionado.')
      }
    } else if (variantIds.length > 0) {
      throw new InvalidReceiptItemError('Este produto possui cores cadastradas; selecione uma.')
    }
  }
}
