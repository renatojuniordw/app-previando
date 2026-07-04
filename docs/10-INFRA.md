# 10 — INFRA
> Contabo VPS — Docker Compose, Nginx, SSL, BullMQ e Backup
> Última atualização: 2026-06-27

---

## Arquitetura no Contabo

```
Internet
    │
    ▼
 Nginx (host)
    │
    ├── previando.com.br       → previando-web    (porta 60001)
    └── app.previando.com.br   → previando-app    (porta 60002)
                                    │
                                    ├── previando-db     (porta 60003, só interno)
                                    ├── previando-redis  (porta 60004, só interno)
                                    └── previando-worker (BullMQ, sem porta exposta)
```

---

## Docker Compose — Desenvolvimento

```yaml
# docker-compose.yml (dev)
services:
  postgres:
    image: postgres:16-alpine
    container_name: previando-postgres
    ports: ["60003:5432"]
    healthcheck: { test: ["CMD-SHELL", "pg_isready -U previando -d previando_db"] }

  redis:
    image: redis:7-alpine
    container_name: previando-redis
    ports: ["60004:6379"]
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck: { test: ["CMD", "redis-cli", "ping"] }
```

> **Atenção:** O compose de produção é separado e não versionado no repositório.

---

## Scripts do Projeto

```bash
npm run dev              # Next.js dev server (porta 60002)
npm run build            # Build produção
npm run start            # Start produção
npm run worker           # BullMQ workers (CNIS + audit + deadlines)
npm run db:generate      # Prisma generate
npm run db:migrate       # Prisma migrate dev
npm run db:migrate:prod  # Prisma migrate deploy
npm run db:seed          # Prisma db seed
npm run db:studio        # Prisma Studio
```

---

## Nginx — Host do Contabo

Configuração com SSL Let's Encrypt, proxy reverso para previando-web (60001) e previando-app (60002).

**Destaques:**
- `client_max_body_size 15M` para upload de PDF
- `proxy_set_header Upgrade $http_upgrade` + `Connection 'upgrade'` para WebSocket (HMR)
- `proxy_read_timeout 60s`

---

## SSL — Let's Encrypt (Certbot)

```bash
certbot --nginx -d previando.com.br -d www.previando.com.br
certbot --nginx -d app.previando.com.br
```

Renovação automática via systemd timer.

---

## Backup Automático

```bash
# PostgreSQL — diário 02:00
0 2 * * * root docker exec previando-db pg_dump -U previando previando_db \
  | gzip > /backups/previando_db_$(date +\%Y\%m\%d).sql.gz

# Manter 30 dias
0 3 * * * root find /backups -name "previando_db_*.sql.gz" -mtime +30 -delete
```

---

## Firewall (Contabo)

```bash
ufw allow 22   # SSH
ufw allow 80   # HTTP
ufw allow 443  # HTTPS
ufw enable
```

Portas internas (60001-60004) NUNCA abertas externamente.

---

## Variáveis de Ambiente (.env)

```env
# Banco de Dados
DATABASE_URL="postgresql://previando:senha@localhost:60003/previando_db"
DATABASE_URL_UNPOOLED="postgresql://previando:senha@localhost:60003/previando_db"

# NextAuth v5
NEXTAUTH_URL="https://app.previando.com.br"
NEXTAUTH_SECRET=""

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Redis
REDIS_URL="redis://localhost:60004"

# Cloudflare R2
R2_ACCOUNT_ID=""
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET_NAME="previando-docs"

# OpenAI
OPENAI_API_KEY=""

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=""
MERCADOPAGO_WEBHOOK_SECRET=""
MP_PLAN_ID_SOLO=""
MP_PLAN_ID_PRO=""

# Admin padrão (seed)
ADMIN_EMAIL=""
ADMIN_PASSWORD=""
ADMIN_NAME="Administrador"

# Segurança
CPF_HASH_SALT=""

# SMTP (Email recovery)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="Previando <noreply@previando.com.br>"

```

---

## Rodar Localmente (dev)

```bash
# 1. Subir infra
docker compose up -d

# 2. Migrations
npx prisma migrate dev

# 3. Seed
npx prisma db seed

# 4. Dev server
npm run dev            # http://localhost:60002

# 5. Worker (outro terminal)
npm run worker
```

---

## Resumo de Portas

| Porta | Serviço | Acesso |
|---|---|---|
| 60001 | previando-web (LP) | Via Nginx → público |
| 60002 | previando-app (Next.js) | Via Nginx → público |
| 60003 | PostgreSQL | 127.0.0.1 apenas |
| 60004 | Redis | 127.0.0.1 apenas |
