# SEO

- **Sitemap**: `src/app/sitemap.ts` — gerado dinamicamente a partir de produtos ativos e
  categorias (`/sitemap.xml`).
- **Robots**: `src/app/robots.ts` — libera a vitrine pública, bloqueia `/admin`,
  `/vendedor` e `/api` (`/robots.txt`).
- **Metadata por página**: `generateMetadata()` em
  `src/app/(public)/produtos/[slug]/page.tsx` e `.../categoria/[slug]/page.tsx` (title,
  description, Open Graph, imagem do produto).
- **Dados estruturados**: JSON-LD `Product` (preço, disponibilidade, imagens) embutido
  na página do produto.
- **URLs amigáveis**: slugs únicos em `products.slug`/`categories.slug`, gerados a
  partir do nome (`lib/utils.ts#slugify`) e editáveis no admin.
- **`metadataBase`** definido em `src/app/layout.tsx` a partir de
  `NEXT_PUBLIC_SITE_URL` — mantenha essa env var apontando para o domínio real em
  produção, senão as URLs absolutas de Open Graph ficam incorretas.

## Ao adicionar novas páginas públicas

Sempre exporte `metadata` (estático) ou `generateMetadata()` (dinâmico) e inclua a rota
no `sitemap.ts` se ela for indexável.
