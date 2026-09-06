# Fase futura: IA no WhatsApp

**Não implementado nesta fase** — este documento existe para deixar registrado que o
banco foi desenhado pensando nessa integração, sem precisar de migrações destrutivas
depois.

## Fluxo alvo

```
WhatsApp → IA → Supabase → consulta produtos/estoque/preços/imagens →
  localiza ou cadastra cliente pelo telefone → registra atendimento →
  (futuramente) registra venda → pontos calculados pelo fluxo oficial
```

## Por que o schema atual já suporta isso

- `customers.phone` é a chave de deduplicação (normalizada, `unique`) — a IA pode
  localizar ou criar um cliente só com o número do WhatsApp, sem inventar um novo
  identificador.
- `products`/`product_images`/`categories` são de leitura pública (RLS permite `anon`
  para produtos ativos) — uma função de IA pode consultar preço/estoque/imagens sem
  precisar de uma role especial.
- Toda venda **precisa** passar por `register_sale`/`confirm_sale` (funções SQL, ver
  `docs/database.md`) — então, quando a IA puder registrar vendas, ela vai *chamar as
  mesmas funções* que o painel do vendedor usa hoje. Isso garante que pontos, estoque e
  comissão sejam calculados pela mesma regra, não por uma lógica paralela dentro da IA.
- `audit_logs` já registra `user_id` nullable — atendimentos feitos pela IA (sem um
  `profiles.id` humano) podem logar com `user_id = null` e uma `action` específica
  (ex.: `atendimento_ia`), sem alterar o schema.

## O que falta construir quando essa fase começar

1. Um "usuário de serviço" (Service Role ou uma role Postgres própria para a IA) restrito
   às funções que ela pode chamar — não dar `service_role` genérico a um agente de IA.
2. Endpoint/Route Handler dedicado (`/api/whatsapp-ai/...`) que valida a origem da
   requisição (assinatura do provedor de WhatsApp) antes de tocar no banco.
3. Registro de "atendimento" como tabela própria (`ai_conversations`?) se for necessário
   histórico de conversa — hoje não existe, e não deve ser criada especulativamente
   antes de saber o formato real do provedor escolhido.
4. Repetir para a IA os mesmos limites de RLS/roles que já existem para vendedor humano:
   ela não deve poder alterar regras de pontos, campanhas ou comissão.
