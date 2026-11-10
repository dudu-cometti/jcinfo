# Análise de SEO local: lojajcinfo.com.br

Data: 09/11/2026 · Ferramenta: claude-seo `seo-local` + inspeção do HTML em produção

## Nota de SEO local: 26/100 (site em produção)

Com as alterações locais deste branch publicadas, a estimativa sobe para ~45/100. O que falta depois disso é sobretudo avaliações e citações, que não se resolvem no código.

| Dimensão | Peso | Nota | Principal motivo |
|---|---|---|---|
| Sinais do Perfil da Empresa | 25 | 12 | Perfil verificado, categorias corretas, 2 produtos. Sem fotos, sem posts, site não aponta para o perfil |
| Avaliações | 20 | 2 | **Zero avaliações** no Google |
| On-page local | 20 | 4 | Sem cidade no título, **sem H1**, sem NAP visível, **canonical apontando para outro domínio** |
| NAP e citações | 15 | 4 | Nome, cidade e telefone ausentes do site; telefone do perfil ≠ WhatsApp do site |
| Schema local | 10 | 2 | Só `Organization` genérico, com URL de outro domínio |
| Links e autoridade local | 10 | 2 | Nenhum sinal local detectado |

## Tipo de negócio
**Empresa de área de atendimento (SAB)**: sem loja aberta ao público, entrega em mãos em Colatina e região. Vertical: varejo de eletrônicos e celulares (principalmente Apple). Tipo de schema: `MobilePhoneStore`.

## Achados críticos

1. **Canonical, sitemap e robots apontam para `jcinfo.vercel.app`.** Em produção, `NEXT_PUBLIC_SITE_URL` é `https://jcinfo.vercel.app/`. Toda página de produto declara `<link rel="canonical" href="https://jcinfo.vercel.app/...">`, e o sitemap lista só URLs `vercel.app` com barra dupla (`//produtos`). O Google é instruído a indexar o domínio da Vercel, não o domínio ligado ao Perfil da Empresa.
   - Código: corrigido (`src/lib/site-url.ts` remove a barra final e é a fonte única de verdade).
   - **Ação na Vercel (manual):** definir `NEXT_PUBLIC_SITE_URL=https://www.lojajcinfo.com.br` no ambiente de produção e fazer redeploy.
   - **Ação na Vercel (manual):** redirecionar `jcinfo.vercel.app` e `lojajcinfo.com.br` (sem www) com 308 para `https://www.lojajcinfo.com.br`. Hoje os três respondem 200 com conteúdo duplicado.
2. **Nenhuma avaliação.** Maior lacuna de ranking. Concorrentes locais têm de 15 a 97 avaliações.

## Checklist do Perfil da Empresa
| Item | Situação |
|---|---|
| Verificado | ✅ |
| Categoria principal: Loja de celulares | ✅ (alterada hoje) |
| Categorias adicionais (4) | ✅ Eletrônicos, Informática, Eletrodomésticos, Ar-condicionado |
| Descrição | ✅ |
| Área de atendimento | ✅ |
| Horário | ✅ Seg–Sáb 07–19 |
| Pagamentos | ✅ Crédito, débito, Visa/Master/Amex/Diners, NFC |
| Produtos | ⚠️ 2 de ~9 planejados |
| Fotos | ❌ Nenhuma |
| Posts | ❌ Nenhum |
| Avaliações | ❌ 0 |
| Pino de endereço exibido para empresa sem loja aberta ao público | ⚠️ Risco de política; dono escolheu manter |

## Auditoria de NAP
| Fonte | Nome | Cidade | Telefone |
|---|---|---|---|
| Perfil da Empresa | JC INFO | Centro, Colatina - ES, 29700-030 | (27) 99904-8005 |
| Site em produção (HTML) | JC Info | — | — (só botão de WhatsApp 27 3044-6085) |
| Schema em produção | JC Info | — | — |
| Site depois deste branch | JC Info | Colatina - ES 29700-030 | +55 27 99904-8005 (schema) |

Pendente: confirmar qual é o telefone principal (99904-8005 ou 3044-6085) e usar o mesmo em todos os lugares.

## Citações
Não verificadas automaticamente. Para criar ou conferir, sempre com o mesmo nome, cidade e telefone:
- Apple Business Connect (Apple Maps)
- Bing Places (alimenta ChatGPT, Copilot e Alexa)
- Página no Facebook + Instagram com o link do perfil e da avaliação
- Agregadores e diretórios BR: Foursquare, Apontador, Guia Mais, TeleListas

## Schema local
Corrigido neste branch: `MobilePhoneStore` com `address` (cidade, UF e CEP, sem rua, coerente com SAB), `areaServed` (10 cidades), `openingHoursSpecification`, `telephone`, `paymentAccepted`, `hasMap` e `sameAs` (URL do Maps pelo CID). Não incluí `geo` de propósito: não há loja física para marcar. Também não incluí `aggregateRating`, porque ainda não há avaliações.

## Top 10 ações
| # | Prioridade | Ação | Quem |
|---|---|---|---|
| 1 | Crítica | Definir `NEXT_PUBLIC_SITE_URL=https://www.lojajcinfo.com.br` na Vercel e fazer redeploy | Dev |
| 2 | Crítica | Redirecionar com 308 o vercel.app e o domínio sem www para o www | Dev (Vercel → Domains) |
| 3 | Crítica | Pedir avaliação a cada cliente depois da entrega (link `g.page/r/CdI_-WwOaONxEBM/review`). Meta: 10 em 30 dias, depois 1 a cada 2 semanas ou menos. Nunca filtrar antes quem vai avaliar | Dono |
| 4 | Alta | Enviar no Search Console o sitemap do domínio www, depois do deploy | Dev |
| 5 | Alta | Subir de 10 a 20 fotos reais (produtos em mãos, entregas, logo, capa) | Dono |
| 6 | Alta | Publicar post semanal no perfil (lançamentos, ar-condicionado no verão, seminovos que chegaram) | Dono |
| 7 | Alta | Unificar o telefone principal (perfil, site e WhatsApp) | Dono + Dev |
| 8 | Média | Cadastrar os 7 produtos restantes no perfil (fotos em ~/Downloads/fotos-google-jcinfo) | Dono |
| 9 | Média | Criar Apple Business Connect + Bing Places | Dono |
| 10 | Média | Criar páginas de categoria com texto local (ex.: "iPhone seminovo em Colatina") e, depois, páginas por cidade só com conteúdo realmente único | Dev |

## Limitações
Esta análise não mediu a posição real no pack local (geo-grid), Domain Authority, backlinks completos, dados do Insights do Perfil nem a presença real em diretórios. Para isso: DataForSEO (geo-grid e listings), Local Falcon ou BrightLocal (rank tracking local) e Search Console (indexação após a correção do domínio).
