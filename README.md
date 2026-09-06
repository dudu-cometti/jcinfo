# JC Info

Sistema de catálogo, vendas e pontos para loja de informática — Next.js + Supabase.

## Stack

Next.js 16 (App Router) · TypeScript · React 19 · Tailwind CSS 4 · Supabase (Postgres,
Auth, Storage) · Vercel

## Papéis

- **Admin**: acesso completo (produtos, estoque, vendas, clientes, pontos, campanhas,
  prêmios, sorteios, vendedores, relatórios, comissões, configurações, logs).
- **Vendedor**: consulta produtos/estoque, cadastra clientes, lança e acompanha suas
  vendas.
- **Cliente**: sem conta — consulta pontos por telefone em `/cliente/dashboard`, navega
  o catálogo e campanhas/sorteios publicamente.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com as chaves do seu projeto Supabase
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Banco de dados

```bash
npx supabase login
npx supabase link --project-ref <seu-project-ref>
npx supabase db push
```

Veja `docs/database.md` para a lista de migrations, as funções SQL que controlam vendas
(`register_sale`/`confirm_sale`/`reverse_sale`) e estoque (`adjust_stock`), e como criar
o primeiro usuário admin.

## Documentação

| Arquivo | Conteúdo |
|---|---|
| `docs/architecture.md` | camadas, autorização em duas etapas, convenções |
| `docs/database.md` | migrations, funções SQL críticas, criar o primeiro admin |
| `docs/authentication.md` | login admin/vendedor, consulta do cliente por telefone |
| `docs/deployment.md` | Supabase → GitHub → Vercel, passo a passo |
| `docs/seo.md` | sitemap, robots, metadata, dados estruturados |
| `docs/tracking.md` | GA4/GTM/Meta Pixel, eventos disparados |
| `docs/future-whatsapp-ai.md` | por que o schema já suporta uma futura IA no WhatsApp |

## Scripts

```bash
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção (roda o type-check)
npm run start    # serve o build de produção
npm run lint     # ESLint
npm test         # testes (Vitest) das regras críticas de venda/estoque/pontos/comissão
```
