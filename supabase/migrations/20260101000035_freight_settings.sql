-- ============================================================
-- Freight (frete) + orçamento defaults, stored in the existing
-- key/value site_settings table (000010) rather than a new table — these
-- are simple non-sensitive scalars/strings, same shape as the settings
-- already there (whatsapp_number, site_name).
-- ============================================================

insert into public.site_settings (key, value) values
  ('freight_default_value', '140.00'::jsonb),
  ('freight_max_value', '300.00'::jsonb),
  ('orcamento_default_validity_days', '3'::jsonb),
  ('store_warranty_text', '"Garantia de 90 dias contra defeitos de fabricação."'::jsonb),
  ('store_address', '""'::jsonb)
on conflict (key) do nothing;
