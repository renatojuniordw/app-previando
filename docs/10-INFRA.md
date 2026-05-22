# 10 — INFRA
> Contabo VPS — Docker Compose, Nginx, SSL, BullMQ e Backup

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

## Docker Compose — previando-web (LP)

```yaml
# previando-web/docker-compose.yml

version: '3.8'

services:
  previando-web:
    build: .
    container_name: previando-web
    restart: always
    ports:
      - "60001:60001"
    environment:
      - NODE_ENV=production
      - PORT=60001
```

```dockerfile
# previando-web/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 60001
```

```nginx
# previando-web/nginx.conf (interno do container)
server {
  listen 60001;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  gzip on;
  gzip_types text/plain text/css application/javascript application/json;
}
```

---

## Docker Compose — previando-app (Sistema)

```yaml
# previando-app/docker-compose.yml

version: '3.8'

services:
  previando-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: previando-app
    restart: always
    ports:
      - "60002:60002"
    environment:
      - NODE_ENV=production
      - PORT=60002
      - DATABASE_URL=postgresql://previando:${DB_PASSWORD}@previando-db:60003/previando_db
      - REDIS_URL=redis://previando-redis:60004
    env_file: .env
    depends_on:
      previando-db:
        condition: service_healthy
      previando-redis:
        condition: service_healthy

  previando-worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    container_name: previando-worker
    restart: always
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://previando:${DB_PASSWORD}@previando-db:60003/previando_db
      - REDIS_URL=redis://previando-redis:60004
    env_file: .env
    depends_on:
      previando-db:
        condition: service_healthy
      previando-redis:
        condition: service_healthy

  previando-db:
    image: postgres:16-alpine
    container_name: previando-db
    restart: always
    ports:
      - "127.0.0.1:60003:5432"   # Apenas localhost — nunca expor externamente
    environment:
      POSTGRES_DB: previando_db
      POSTGRES_USER: previando
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - previando_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U previando -d previando_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  previando-redis:
    image: redis:7-alpine
    container_name: previando-redis
    restart: always
    ports:
      - "127.0.0.1:60004:6379"   # Apenas localhost — nunca expor externamente
    volumes:
      - previando_redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  previando_db_data:
  previando_redis_data:
```

---

## Dockerfile — App Next.js

```dockerfile
# previando-app/Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=60002

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 60002
CMD ["npm", "start"]
```

---

## Dockerfile — Worker BullMQ

```dockerfile
# previando-app/Dockerfile.worker
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/jobs ./jobs
COPY --from=builder /app/services ./services
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate

CMD ["node", "jobs/worker.js"]
```

---

## Nginx — Host do Contabo (roteamento por subdomínio)

```nginx
# /etc/nginx/sites-available/previando

# previando.com.br → LP React (60001)
server {
    listen 80;
    server_name previando.com.br www.previando.com.br;
    return 301 https://previando.com.br$request_uri;
}

server {
    listen 443 ssl http2;
    server_name previando.com.br www.previando.com.br;

    ssl_certificate     /etc/letsencrypt/live/previando.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/previando.com.br/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;

    # Redirecionar www para sem www
    if ($host = www.previando.com.br) {
        return 301 https://previando.com.br$request_uri;
    }

    location / {
        proxy_pass http://127.0.0.1:60001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# app.previando.com.br → App Next.js (60002)
server {
    listen 80;
    server_name app.previando.com.br;
    return 301 https://app.previando.com.br$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.previando.com.br;

    ssl_certificate     /etc/letsencrypt/live/app.previando.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.previando.com.br/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;

    # Upload de PDF — aumentar limite
    client_max_body_size 15M;

    location / {
        proxy_pass http://127.0.0.1:60002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
```

---

## SSL — Let's Encrypt (Certbot)

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Gerar certificados
certbot --nginx -d previando.com.br -d www.previando.com.br
certbot --nginx -d app.previando.com.br

# Renovação automática (já configurada pelo Certbot)
# Verificar: crontab -l | grep certbot
# ou: systemctl status certbot.timer
```

---

## Deploy — Passo a Passo

```bash
# 1. Clonar repositórios no Contabo
git clone git@github.com:seu-usuario/previando-web.git
git clone git@github.com:seu-usuario/previando-app.git

# 2. Configurar .env do app
cp previando-app/.env.example previando-app/.env
# Editar com os valores reais

# 3. Subir infraestrutura
cd previando-app
docker compose up -d previando-db previando-redis

# 4. Rodar migrations e seed
docker compose run --rm previando-app npx prisma migrate deploy
docker compose run --rm previando-app npx prisma db seed

# 5. Subir app + worker
docker compose up -d previando-app previando-worker

# 6. Subir LP
cd ../previando-web
docker compose up -d previando-web

# 7. Configurar Nginx + SSL
# (copiar config, certbot, nginx -t, systemctl reload nginx)

# 8. Verificar
curl https://previando.com.br      # LP
curl https://app.previando.com.br  # App
```

---

## Deploy Contínuo (atualizar)

```bash
# Script de update — previando-app
cd /srv/previando-app
git pull origin main
docker compose build previando-app previando-worker
docker compose up -d --no-deps previando-app previando-worker
docker compose run --rm previando-app npx prisma migrate deploy

# Script de update — previando-web
cd /srv/previando-web
git pull origin main
docker compose build previando-web
docker compose up -d --no-deps previando-web
```

---

## Backup Automático

```bash
# /etc/cron.d/previando-backup

# PostgreSQL — todo dia às 02:00
0 2 * * * root docker exec previando-db pg_dump -U previando previando_db \
  | gzip > /backups/previando_db_$(date +\%Y\%m\%d).sql.gz

# Manter 30 dias de backup
0 3 * * * root find /backups -name "previando_db_*.sql.gz" -mtime +30 -delete

# Redis snapshot — todo dia às 02:30 (append-only já ativo no container)
30 2 * * * root docker exec previando-redis redis-cli BGSAVE
```

---

## Firewall (Contabo)

```bash
# Abrir apenas as portas necessárias externamente
ufw allow 22    # SSH
ufw allow 80    # HTTP (redirect para HTTPS)
ufw allow 443   # HTTPS

# Portas internas — NUNCA abertas externamente
# 60001: acessível via Nginx proxy
# 60002: acessível via Nginx proxy
# 60003 (PostgreSQL): apenas 127.0.0.1 (Docker binding)
# 60004 (Redis):      apenas 127.0.0.1 (Docker binding)

ufw enable
ufw status
```

---

## Variáveis de Ambiente Locais (dev)

```bash
# previando-app/.env.local (desenvolvimento)

DATABASE_URL="postgresql://previando:senha@localhost:60003/previando_db"
REDIS_URL="redis://localhost:60004"
NEXTAUTH_URL="http://localhost:60002"
NEXTAUTH_SECRET="dev-secret-qualquer"
# ... demais vars

# Para rodar localmente:
docker compose up -d previando-db previando-redis  # só infra
npm run dev                                          # Next.js na 60002
node jobs/worker.js                                  # Worker em outro terminal
```

---

## Resumo de Portas

| Porta | Serviço | Acesso |
|---|---|---|
| 60001 | previando-web (LP React) | Via Nginx → público |
| 60002 | previando-app (Next.js) | Via Nginx → público |
| 60003 | PostgreSQL (previando_db) | 127.0.0.1 apenas |
| 60004 | Redis (BullMQ + cache) | 127.0.0.1 apenas |
