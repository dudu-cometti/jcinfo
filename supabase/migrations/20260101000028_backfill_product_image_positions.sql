-- ============================================================
-- product_images.position has always defaulted to 0 and nothing ever set
-- it past that, so every existing product's photos tie at position 0 and
-- reordering (which swaps two rows' position values) would be a no-op.
-- Backfills a real 0,1,2... order per product, preferring created_at for
-- ties, so drag/move controls have something meaningful to swap.
-- ============================================================

with ranked as (
  select id, row_number() over (partition by product_id order by position, created_at) - 1 as rn
  from public.product_images
)
update public.product_images pi
set position = ranked.rn
from ranked
where pi.id = ranked.id;
