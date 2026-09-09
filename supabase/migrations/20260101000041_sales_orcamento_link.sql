-- ============================================================
-- Additive, nullable columns on `sales` to record which orçamento (if any)
-- a sale came from, plus freight/machine/installment metadata. Deliberately
-- NOT a new side table: register_sale()/confirm_sale() insert `sales` via
-- an explicit column list (verified by reading 000029's function bodies),
-- so these new nullable-with-default columns are invisible to them — zero
-- risk to existing sales/points/commission flows. They are populated only
-- by convert_orcamento_to_sale() (000042) via a direct UPDATE immediately
-- after register_sale() returns, in the same transaction; `sales` still has
-- no direct update policy for anyone else.
-- ============================================================

alter table public.sales add column orcamento_id uuid references public.orcamentos (id) on delete set null;
alter table public.sales add column freight_value numeric(12, 2) not null default 0 check (freight_value >= 0);
alter table public.sales add column machine_id uuid references public.payment_machines (id) on delete set null;
alter table public.sales add column payment_method public.payment_method;
alter table public.sales add column installments integer;
alter table public.sales add column percentage_applied numeric(5, 2);
alter table public.sales add column fixed_value_applied numeric(12, 2);

create index sales_orcamento_id_idx on public.sales (orcamento_id);
