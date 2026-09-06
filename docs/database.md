# Banco de dados

## Migrations

Em `supabase/migrations/`, aplicadas em ordem pelo nome (timestamp no início):

| Arquivo | Conteúdo |
|---|---|
| `000001_extensions_and_helpers.sql` | extensões, enums, trigger `set_updated_at()` |
| `000002_profiles.sql` | `profiles`, `handle_new_user()` trigger, `is_admin()`/`is_staff()` |
| `000003_catalog.sql` | `categories`, `products`, `product_images` |
| `000004_customers.sql` | `customers` (telefone normalizado e único) |
| `000005_sales.sql` | `sales`, `sale_items` |
| `000006_inventory_movements.sql` | histórico append-only de estoque |
| `000007_points_transactions.sql` | ledger append-only de pontos |
| `000008_rewards_campaigns_raffles.sql` | prêmios, campanhas, sorteios |
| `000009_commissions.sql` | regras de comissão + comissões geradas |
| `000010_audit_logs_and_settings.sql` | `audit_logs`, `site_settings` |
| `000011_sale_functions.sql` | ciclo de vida da venda (funções atômicas) |
| `000012_reporting_indexes.sql` | índices para os relatórios/dashboard |
| `000013_storage.sql` | bucket `product-images` + políticas |
| `000014_stock_adjustments.sql` | `adjust_stock()` (entrada/saída/ajuste manual) |
| `000015_customer_lookup.sql` | `get_customer_summary()` (consulta pública por telefone) |

## Rodando localmente

```bash
npx supabase login
npx supabase link --project-ref <seu-project-ref>
npx supabase db push        # aplica as migrations pendentes no projeto remoto
npx supabase db reset       # (ambiente local com Docker) aplica migrations + seed.sql
```

Depois de linkar o projeto, regenere os tipos TypeScript (o arquivo
`src/types/database.ts` foi escrito manualmente até aqui, espelhando as migrations):

```bash
npx supabase gen types typescript --linked > src/types/database.ts
```

## Funções SQL críticas (`SECURITY DEFINER`)

Todas em `000011_sale_functions.sql` e `000014_stock_adjustments.sql`. Rodam com o
privilégio do dono da função (bypassando RLS internamente) mas **revalidam a role do
chamador via `auth.uid()`/`is_admin()`/`is_staff()` na primeira linha** — nunca confie
apenas no `GRANT EXECUTE`.

- `register_sale(customer_id, items, discount, notes, origin)` — cria a venda em
  `pendente`, recalculando o subtotal a partir de `products.price`/`promo_price` (ignora
  qualquer preço vindo do cliente).
- `confirm_sale(sale_id)` — transição `pendente -> confirmada`: debita estoque, grava
  `inventory_movements`, gera pontos (`floor(total)`), grava `points_transactions`,
  atualiza `customers.points`/`total_spent`, aplica a `commission_rules` vigente e grava
  `commissions`.
- `complete_sale(sale_id)` — marcador de "entregue", sem efeitos colaterais adicionais.
- `cancel_sale(sale_id, reason)` — só permitido antes da confirmação (sem estoque/pontos
  a reverter).
- `reverse_sale(sale_id, reason)` — admin-only, motivo obrigatório. Reverte estoque e
  pontos com registros de `estorno` (nunca apaga o histórico), cancela a comissão.
- `adjust_stock(product_id, type, quantity, reason)` — único caminho para movimentação
  manual de estoque; grava produto + `inventory_movements` na mesma transação.

## Criando o primeiro admin

Novos usuários do Supabase Auth entram como `vendedor` por padrão (trigger
`handle_new_user`). Para promover a admin:

```sql
update public.profiles set role = 'admin' where id = '<uuid-do-usuario>';
```

Ou crie um usuário já como vendedor/admin pelo próprio painel em
`/admin/vendedores/novo` (usa a Service Role Key no servidor, nunca exposta ao browser).
