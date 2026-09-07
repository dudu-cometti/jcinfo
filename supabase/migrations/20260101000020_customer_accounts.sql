-- ============================================================
-- Real customer accounts (email + CPF + password via Supabase Auth),
-- replacing the anonymous phone-lookup from migration 000015. CPF is
-- collected for identity confidence (a real account should feel like one),
-- validated at the application layer (checksum), stored as digits only.
--
-- Customers become Supabase Auth users on registration, but they are NOT
-- staff: handle_new_user() (migration 000002) unconditionally created a
-- `profiles` row (role='vendedor') for every new auth.users row, which
-- would have wrongly turned every self-registering customer into a
-- seller with access to /vendedor. It's updated below to skip that for
-- accounts flagged as customers at signup (raw_user_meta_data.account_type
-- = 'customer') — the customer row itself is created/linked by the
-- registration Server Action via the service-role client, not by this
-- trigger.
-- ============================================================

alter table public.customers add column cpf text unique;
alter table public.customers add column auth_user_id uuid unique references auth.users (id) on delete set null;

create index customers_auth_user_id_idx on public.customers (auth_user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data ->> 'account_type', 'staff') = 'customer' then
    return new;
  end if;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    'vendedor'
  );
  return new;
end;
$$;

-- --- Customer self-access (read-only): a logged-in customer sees their
-- own points, purchase history, pre-order signups and points ledger, but
-- nothing belonging to anyone else. Writing to `customers` stays
-- staff-only for now (customers_staff_update, migration 000004).

create policy "customers_self_select"
  on public.customers for select
  to authenticated
  using (auth_user_id = auth.uid());

create policy "points_transactions_self_select"
  on public.points_transactions for select
  to authenticated
  using (
    exists (
      select 1 from public.customers
      where customers.id = points_transactions.customer_id
        and customers.auth_user_id = auth.uid()
    )
  );

create policy "sales_customer_self_select"
  on public.sales for select
  to authenticated
  using (
    exists (
      select 1 from public.customers
      where customers.id = sales.customer_id
        and customers.auth_user_id = auth.uid()
    )
  );

create policy "sale_items_customer_self_select"
  on public.sale_items for select
  to authenticated
  using (
    exists (
      select 1 from public.sales
      join public.customers on customers.id = sales.customer_id
      where sales.id = sale_items.sale_id
        and customers.auth_user_id = auth.uid()
    )
  );

create policy "preorder_signups_self_select"
  on public.preorder_signups for select
  to authenticated
  using (
    exists (
      select 1 from public.customers
      where customers.id = preorder_signups.customer_id
        and customers.auth_user_id = auth.uid()
    )
  );

create policy "raffle_entries_self_select"
  on public.raffle_entries for select
  to authenticated
  using (
    exists (
      select 1 from public.customers
      where customers.id = raffle_entries.customer_id
        and customers.auth_user_id = auth.uid()
    )
  );

-- The anonymous phone-lookup is superseded by real accounts.
drop function if exists public.get_customer_summary(text);

-- Ranking position needs to compare against every customer's points, which
-- customers_self_select (above) deliberately does not allow — a customer
-- should never be able to browse other customers' rows. SECURITY DEFINER
-- bypasses that just for this one aggregate count, never exposing anyone
-- else's identity.
create or replace function public.get_my_rank()
returns bigint
language sql
security definer
set search_path = public
stable
as $$
  select count(*) + 1
  from public.customers c
  where c.points > (select points from public.customers where auth_user_id = auth.uid());
$$;

grant execute on function public.get_my_rank() to authenticated;
