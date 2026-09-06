# Deploy

## 1. Criar o projeto Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings > API**, copie `Project URL`, `anon public key` e
   `service_role key`.
3. Rode as migrations (ver `docs/database.md`):
   ```bash
   npx supabase login
   npx supabase link --project-ref <seu-project-ref>
   npx supabase db push
   ```
4. Crie o primeiro admin em `/admin/vendedores/novo` (após o deploy) ou via SQL.

## 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # secreta — nunca no client, nunca commitada
NEXT_PUBLIC_SITE_NAME="JC Info"
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=      # opcional; o principal é configurável em /admin/configuracoes
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_META_PIXEL_ID=
```

`.env.local` está no `.gitignore` (`.env*`) — nunca será commitado.

## 3. Rodando localmente

```bash
npm install
npm run dev
```

## 4. GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <url-do-seu-repo>
git push -u origin main
```

## 5. Vercel

1. Importe o repositório em [vercel.com/new](https://vercel.com/new).
2. Framework preset: **Next.js** (detectado automaticamente).
3. Adicione as mesmas variáveis de `.env.local` em **Project Settings > Environment
   Variables** (troque `NEXT_PUBLIC_SITE_URL` pelo domínio de produção).
4. Deploy. Builds subsequentes disparam a cada push na branch configurada.

## 6. Domínio próprio

Em **Project Settings > Domains** na Vercel, adicione o domínio e siga as instruções de
DNS (registro `A`/`CNAME` conforme indicado). Atualize `NEXT_PUBLIC_SITE_URL` para o
domínio final (usado no sitemap, metadata e Open Graph).
