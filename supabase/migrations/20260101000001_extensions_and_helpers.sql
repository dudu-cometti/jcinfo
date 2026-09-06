-- ============================================================
-- Extensions, enums and shared helper functions/triggers
-- ============================================================

create extension if not exists "pgcrypto";

-- Roles for internal (Supabase Auth) users. Customers are NOT part of this
-- enum — they are stored in `customers` and are not Supabase Auth users yet
-- (see docs/authentication.md for the future phone/email login phase).
create type public.user_role as enum ('admin', 'vendedor');

create type public.product_status as enum ('ativo', 'inativo');

create type public.sale_status as enum (
  'pendente',
  'confirmada',
  'concluida',
  'cancelada',
  'estornada'
);

create type public.inventory_movement_type as enum (
  'entrada',
  'saida',
  'ajuste',
  'venda',
  'cancelamento',
  'estorno'
);

create type public.points_movement_type as enum (
  'entrada',
  'saida',
  'ajuste',
  'estorno'
);

create type public.campaign_status as enum ('rascunho', 'ativa', 'encerrada');

create type public.raffle_status as enum ('aberto', 'encerrado', 'cancelado');

create type public.commission_status as enum ('pendente', 'aprovada', 'paga', 'cancelada');

-- Generic updated_at trigger, reused by every table below.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- current_user_role()/is_admin()/is_staff() are created in migration
-- 20260101000002, right after `profiles` exists (they query it).
