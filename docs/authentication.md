# Autenticação

## Admin e Vendedor

Autenticação via **Supabase Auth** (e-mail/senha).

- Login: `src/app/login/page.tsx` + `src/app/login/actions.ts` (`login`/`logout`,
  Server Actions com `useActionState`).
- Sessão é lida via cookies (`@supabase/ssr`), atualizada a cada request pelo Proxy
  (`src/proxy.ts`).
- **Duas camadas de checagem** (ver `docs/architecture.md`): Proxy (otimista, só
  existência de sessão) + `requireRole()` do DAL (real, consulta `profiles.role`) em
  toda Server Action/Server Component sensível.
- Recuperação de senha: usa o fluxo padrão do Supabase Auth (reset por e-mail); não há
  UI própria ainda além do formulário de login — adicione uma tela em `/login/recuperar`
  chamando `supabase.auth.resetPasswordForEmail()` quando for necessário.

Novo usuário do Supabase Auth → trigger `handle_new_user` cria a `profiles` row com
`role = 'vendedor'`. Promoção a admin é manual (painel `/admin/vendedores` ou SQL — ver
`docs/database.md`).

## Cliente

Clientes **não são usuários do Supabase Auth**. Cadastro mínimo (nome, telefone,
e-mail) fica em `public.customers`, com o telefone como chave de deduplicação
(normalizado para dígitos antes de gravar — `lib/utils.ts#normalizePhone`).

A área do cliente (`/cliente/dashboard`) é uma consulta simples por telefone, sem login:
chama a função `get_customer_summary(phone)` (SQL, `SECURITY DEFINER`,
`supabase/migrations/000015_customer_lookup.sql`), que expõe **apenas** nome, pontos,
total gasto e posição no ranking — nunca telefone/e-mail/observações de terceiros.

### Fase futura: login do cliente por telefone/e-mail

Não implementado agora (fora do escopo desta fase), mas o banco já está pronto para
isso sem migração destrutiva:

1. Adicionar Supabase Auth (ou OTP por SMS/e-mail) para clientes.
2. Adicionar `auth_user_id uuid references auth.users(id)` em `customers` (nullable, migrado
   por telefone/e-mail existentes).
3. Trocar `get_customer_summary` por queries autenticadas com RLS baseada em
   `auth.uid() = customers.auth_user_id`, liberando também o histórico de pontos e
   compras (hoje restrito a staff).

Ver também `docs/future-whatsapp-ai.md`.
