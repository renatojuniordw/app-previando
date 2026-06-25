# Previando — App

## Requisitos

- Node.js 20+
- Docker e Docker Compose

---

## Configuração inicial

```bash
cp .env.example .env
# Edite o .env com suas chaves
npm install
```

---

## Infraestrutura local (Postgres + Redis)

```bash
# Subir
docker compose up -d

# Parar (mantém dados)
docker compose stop

# Parar e remover tudo (inclusive volumes)
docker compose down -v
```

| Serviço  | Porta local |
|----------|-------------|
| Postgres | 60003       |
| Redis    | 60004       |

---

## Banco de dados

```bash
# Gerar o Prisma Client (após mudanças no schema)
npm run db:generate

# Rodar migrações (desenvolvimento)
npm run db:migrate

# Rodar migrações (produção — sem interatividade)
npm run db:migrate:prod

# Popular banco com dados iniciais (seed)
npm run db:seed

# Abrir Prisma Studio no browser
npm run db:studio
```

> **Primeira vez:** rode `db:migrate` antes de `db:seed`.

---

## Rodando a aplicação

```bash
# Next.js (dev) — http://localhost:60002
npm run dev

# Worker BullMQ (processamento de CNIS + notificações de prazo)
npm run worker
```

> O worker precisa estar rodando em paralelo com o Next.js para processar uploads de CNIS e enviar notificações de prazo (job diário às 8h).

---

## Build de produção

```bash
npm run build
npm run start
```

---

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | URL de conexão com o Postgres |
| `REDIS_URL` | URL de conexão com o Redis |
| `NEXTAUTH_SECRET` | Gere com `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Credenciais OAuth do Google |
| `AI_PROVIDER` | `openai` (padrão) ou `verboo` |
| `OPENAI_API_KEY` | Chave da OpenAI (se `AI_PROVIDER=openai`) |
| `VERBOO_API_KEY` | Chave do Verboo (se `AI_PROVIDER=verboo`) |
| `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` | Cloudflare R2 (armazenamento de PDFs) |
| `MERCADOPAGO_ACCESS_TOKEN` | Integração com Mercado Pago |
| `CPF_HASH_SALT` | Salt fixo para hash de CPF — **nunca alterar após o primeiro deploy** — falha explícita se ausente |
| `MERCADOPAGO_WEBHOOK_SECRET` | Segredo para verificação da assinatura HMAC do webhook do Mercado Pago |
| `MP_PLAN_ID_SOLO` / `MP_PLAN_ID_PRO` | IDs dos planos de assinatura criados no painel do Mercado Pago |
| `DATAJUD_API_KEY` | API pública do CNJ |
