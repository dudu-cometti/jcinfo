# Arquitetura

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript
- **Tailwind CSS 4**
- **Supabase**: Postgres, Auth, Storage
- Deploy alvo: **Vercel**

`cacheComponents` está **desativado** de propósito (`next.config.ts`): este é um painel
administrativo orientado a dados sempre atuais (estoque, vendas, pontos) — o modelo de
cache "Previous Model" (fetch + `revalidatePath`) é mais simples e previsível aqui do que
Partial Prerendering. Reavalie se o catálogo público crescer a ponto de precisar de ISR.

## Camadas

```
app/                     rotas (App Router)
  (public)/              vitrine pública — layout com header/footer próprios
  admin/                 painel do administrador (protegido por requireRole('admin'))
  vendedor/              painel do vendedor (requireRole('admin', 'vendedor'))
  cliente/               área simples do cliente (sem conta, consulta por telefone)
  api/                   Route Handlers (busca para autocomplete, exportação CSV)
  login/                 tela de login + Server Actions de auth

components/
  ui/                    primitivos (Button, Input, Table, Card, Badge...)
  sales/, customers/     componentes de domínio compartilhados entre admin e vendedor
  public/                componentes da vitrine (ProductCard, WhatsAppButton)
  analytics/             scripts de tracking (GA4/GTM/Meta Pixel)

lib/
  supabase/              clientes Supabase (browser, server, admin/service-role, proxy)
  auth/dal.ts            Data Access Layer de autenticação/autorização (verifySession,
                         requireRole) — SEMPRE consultado a partir de Server
                         Components/Actions, nunca confiar só no Proxy
  actions/               Server Actions que envolvem regra de negócio (vendas, clientes,
                         campanhas, sorteios, comissões, configurações, vendedores)
  validations/           schemas Zod
  data/                  leituras compostas (dashboard, date-range, settings)
  reports/                geração de CSV
```

## Autorização em duas camadas

1. **Proxy** (`src/proxy.ts` + `lib/supabase/middleware.ts`): checagem *otimista* —
   existe sessão? Redireciona para `/login` se não. Não consulta o banco (roda em toda
   requisição, inclusive prefetch).
2. **DAL** (`lib/auth/dal.ts`) + **RLS** no Postgres: checagem *real* de papel
   (admin/vendedor). Toda Server Action e Server Component sensível chama
   `requireRole(...)`. As policies RLS são a última linha de defesa — mesmo que uma rota
   esqueça de chamar `requireRole`, o Postgres nunca deixa um vendedor ler a comissão de
   outro vendedor, por exemplo.

## Regra de ouro dos dados sensíveis (preço, estoque, pontos, comissão)

Nunca são escritos diretamente pelo cliente. Toda mudança de vendas passa pelas funções
SQL `SECURITY DEFINER` em `supabase/migrations/000011_sale_functions.sql`
(`register_sale`, `confirm_sale`, `cancel_sale`, `complete_sale`, `reverse_sale`) e
`000014_stock_adjustments.sql` (`adjust_stock`) — veja `docs/database.md`.
