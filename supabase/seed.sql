-- ============================================================
-- Development-only seed data. Never run against production.
-- Loaded automatically by `supabase db reset` in local dev.
-- Admin/vendedor users are NOT created here (they're Supabase Auth users,
-- not plain rows) — see docs/database.md for how to create them locally.
-- ============================================================

insert into public.categories (name, slug) values
  ('Celulares', 'celulares'),
  ('iPhone', 'iphone'),
  ('Xiaomi', 'xiaomi'),
  ('Computadores', 'computadores'),
  ('Notebooks', 'notebooks'),
  ('MacBook', 'macbook'),
  ('Acessórios', 'acessorios'),
  ('Drones', 'drones'),
  ('Tablets', 'tablets'),
  ('Smartwatches', 'smartwatches'),
  ('Fones', 'fones'),
  ('Eletrônicos', 'eletronicos'),
  ('Outros', 'outros')
on conflict (slug) do nothing;

insert into public.products (
  name, slug, description, category_id, brand, model,
  price, promo_price, cost, stock, min_stock, sku, internal_code,
  status, featured
)
select
  p.name, p.slug, p.description,
  (select id from public.categories where slug = p.category_slug),
  p.brand, p.model, p.price, p.promo_price, p.cost, p.stock, p.min_stock,
  p.sku, p.internal_code, 'ativo'::public.product_status, p.featured
from (
  values
    ('iPhone 15 128GB', 'iphone-15-128gb', 'iPhone 15 128GB, tela Super Retina XDR.', 'iphone', 'Apple', 'iPhone 15', 6499.00, 5999.00, 5200.00, 12, 3, 'IP15-128', 'INT-0001', true),
    ('Xiaomi Redmi Note 13', 'xiaomi-redmi-note-13', 'Xiaomi Redmi Note 13, 256GB, câmera 108MP.', 'xiaomi', 'Xiaomi', 'Redmi Note 13', 1899.00, null, 1400.00, 25, 5, 'XIA-RN13', 'INT-0002', false),
    ('Drone DJI Mini 4 Pro', 'drone-dji-mini-4-pro', 'Drone DJI Mini 4 Pro com câmera 4K.', 'drones', 'DJI', 'Mini 4 Pro', 5299.00, 4799.00, 4100.00, 6, 2, 'DJI-MINI4', 'INT-0003', true),
    ('Notebook Dell Inspiron 15', 'notebook-dell-inspiron-15', 'Notebook Dell Inspiron 15, i5, 16GB RAM, 512GB SSD.', 'notebooks', 'Dell', 'Inspiron 15', 4299.00, null, 3500.00, 8, 2, 'DELL-INS15', 'INT-0004', false),
    ('Fone JBL Tune 510BT', 'fone-jbl-tune-510bt', 'Fone de ouvido Bluetooth JBL Tune 510BT.', 'fones', 'JBL', 'Tune 510BT', 299.00, 249.00, 180.00, 40, 10, 'JBL-510BT', 'INT-0005', true)
) as p(name, slug, description, category_slug, brand, model, price, promo_price, cost, stock, min_stock, sku, internal_code, featured)
on conflict (slug) do nothing;

insert into public.rewards (name, description, quantity, points_required, status) values
  ('Fone de ouvido Bluetooth', 'Fone bluetooth de brinde para clientes fiéis.', 20, 10000, 'ativo'),
  ('Drone de entrada', 'Drone de entrada para sorteio de clientes VIP.', 3, 20000, 'ativo')
on conflict do nothing;

insert into public.point_campaigns (name, description, min_points, start_date, end_date, status, featured) values
  ('Junte 10.000 pontos e ganhe um fone', 'Campanha de fidelidade - fone de ouvido.', 10000, now(), now() + interval '90 days', 'ativa', true),
  ('Junte 20.000 pontos e concorra a um drone', 'Campanha de fidelidade - sorteio de drone.', 20000, now(), now() + interval '90 days', 'ativa', true)
on conflict do nothing;

insert into public.commission_rules (name, percentage, description, status) values
  ('Comissão padrão', 3.00, 'Comissão padrão de 3% sobre vendas confirmadas.', 'ativa')
on conflict do nothing;
