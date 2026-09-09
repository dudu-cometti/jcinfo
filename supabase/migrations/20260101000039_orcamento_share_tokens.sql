-- ============================================================
-- Random, revocable public share tokens for the WhatsApp image link — the
-- orçamento must never be reachable by its (predictable, sequential-ish)
-- UUID alone. No select policy exists here for anon at all: the public
-- image route reads through a SECURITY DEFINER function (000040), never
-- this table directly, so an anonymous request can never enumerate rows.
-- ============================================================

create table public.orcamento_share_tokens (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references public.orcamentos (id) on delete cascade,
  token text not null unique,
  revoked boolean not null default false,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now()
);

create index orcamento_share_tokens_orcamento_id_idx on public.orcamento_share_tokens (orcamento_id);
create index orcamento_share_tokens_token_idx on public.orcamento_share_tokens (token) where revoked = false;

alter table public.orcamento_share_tokens enable row level security;

create policy "orcamento_share_tokens_admin_select_all" on public.orcamento_share_tokens
  for select to authenticated using (public.is_admin());
create policy "orcamento_share_tokens_seller_select_own" on public.orcamento_share_tokens
  for select to authenticated
  using (exists (select 1 from public.orcamentos o where o.id = orcamento_share_tokens.orcamento_id and o.seller_id = auth.uid()));
create policy "orcamento_share_tokens_staff_insert" on public.orcamento_share_tokens
  for insert to authenticated
  with check (
    exists (
      select 1 from public.orcamentos o
      where o.id = orcamento_share_tokens.orcamento_id
        and (o.seller_id = auth.uid() or public.is_admin())
    )
  );
create policy "orcamento_share_tokens_staff_revoke" on public.orcamento_share_tokens
  for update to authenticated
  using (
    exists (
      select 1 from public.orcamentos o
      where o.id = orcamento_share_tokens.orcamento_id
        and (o.seller_id = auth.uid() or public.is_admin())
    )
  )
  with check (revoked = true);
