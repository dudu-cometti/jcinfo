# Tracking (Google / Meta)

Implementado em `src/components/analytics/Analytics.tsx`, montado no `RootLayout`. Cada
script só carrega se sua env var estiver definida — nunca com IDs inventados:

| Env var | Serviço |
|---|---|
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager (tem prioridade sobre GA4 direto, para evitar carregar os dois) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 (usado só se `NEXT_PUBLIC_GTM_ID` não estiver setado) |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel |

## Eventos disparados

| Evento | Onde | Quando |
|---|---|---|
| `page_view` | automático (GA4/GTM/Pixel) | toda navegação |
| `contact_whatsapp` | `components/public/WhatsAppButton.tsx` | clique no botão de WhatsApp do produto (também grava em `audit_logs` via `log_audit` RPC, para relatório interno) |
| `purchase` | `components/sales/SaleActions.tsx` | **somente** quando `confirm_sale()` retorna sucesso — nunca em `pendente` |

`view_item`, `search` e `lead` estão no roadmap (spec original) mas não implementados
nesta fase — adicione onde fizer sentido (`app/(public)/produtos/[slug]/page.tsx` para
`view_item`, formulário de busca para `search`) seguindo o mesmo padrão: push condicional
em `window.dataLayer`, nunca hardcoded.

## Configuração na Vercel

Adicione as mesmas variáveis em **Project Settings > Environment Variables**. Sem elas,
o app funciona normalmente — os scripts de tracking simplesmente não são renderizados.
