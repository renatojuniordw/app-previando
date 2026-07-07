# 17 — VPS Setup (Cloudflare Tunnel + Docker Compose)
> Contabo VPS — Docker Compose, Nginx local, Cloudflare Tunnel
> Última atualização: 2026-07-07

---

## Arquitetura

```
 Internet
    │
    ▼
 Cloudflare Edge (SSL termination)
    │
    ▼ cloudflared tunnel
 VPS (nenhuma porta pública)
    │
    ├─ Nginx (localhost:80)
    │   ├── app.previando.com.br → 127.0.0.1:60002
    │   └── previando.com.br     → 127.0.0.1:60001 (LP futura)
    │
    └─ Docker Compose
        ├── previando-app     (Next.js :60002)
        ├── previando-worker  (BullMQ)
        ├── previando-postgres (:60003)
        └── previando-redis   (:60004)
```

**Tudo roda em Docker. Zero Node.js ou PM2 no host.**

---

## 1. Pré-requisitos na VPS

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Docker + Compose plugin
apt install -y docker.io docker-compose-v2
systemctl enable --now docker

# cloudflared (Cloudflare Tunnel)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cloudflared.deb
dpkg -i /tmp/cloudflared.deb

# Nginx
apt install -y nginx
```

---

## 2. Clonar o Projeto

```bash
mkdir -p /opt/apps/projetos_pessoais/previando
git clone git@github.com:renatojuniordw/app-previando.git /opt/apps/projetos_pessoais/previando/app
```

---

## 3. Configurar .env

```bash
cd /opt/apps/projetos_pessoais/previando/app
cp .env.example .env
```

Editar `.env` com os valores reais. **Atenção ao DATABASE_URL e REDIS_URL** — dentro do Docker, os containers se enxergam pelo nome do serviço, não por `localhost`:

```env
# Banco (via docker network, nome do container = serviço)
DATABASE_URL="postgresql://previando:<senha>@postgres:5432/previando_db"

# NextAuth
NEXTAUTH_URL="https://app.previando.com.br"
NEXTAUTH_SECRET="<openssl rand -base64 32>"

# Redis (via docker network)
REDIS_URL="redis://default:<senha-redis>@redis:6379"

# Variáveis dos containers Docker (lidas pelo docker-compose)
POSTGRES_USER=previando
POSTGRES_PASSWORD=<senha>
POSTGRES_DB=previando_db
REDIS_PASSWORD=<senha-redis>

# Demais variáveis (Google OAuth, R2, OpenAI, Mercado Pago, etc.)
# Preencher conforme .env.example
```

> **Por que `postgres` e `redis` em vez de `localhost`?**
> No Docker Compose, containers na mesma rede se comunicam pelo nome do serviço. O `app` e `worker` enxergam `postgres:5432` e `redis:6379`. Já o Nginx (fora do Docker) acessa a app via `127.0.0.1:60002`.

---

## 4. Primeiro Deploy

```bash
cd /opt/apps/projetos_pessoais/previando/app

# Build da imagem (Next.js + worker)
docker compose build

# Subir todos os serviços
docker compose up -d

# Verificar
docker compose ps
# Deve mostrar todos os 4 containers como "Up"
```

**O que acontece no primeiro `up`:**
1. Postgres e Redis sobem primeiro (healthcheck)
2. App e worker só startam após Postgres e Redis estarem saudáveis
3. O `docker-entrypoint.sh` roda `prisma migrate deploy` automaticamente antes de iniciar o Next.js
4. App escuta em `0.0.0.0:60002` (dentro do container), mapeado para `127.0.0.1:60002` no host

---



---

## 5. Cloudflare Tunnel

### 6.1 Autenticar

```bash
cloudflared tunnel login
# Abre URL no navegador, autorizar o domínio previando.com.br
```

### 6.2 Criar o Tunnel

```bash
cloudflared tunnel create previando
# Saída algo como: Created tunnel previando with id abc123def-4567-...
# Guardar o tunnel-id
```

### 6.3 Configurar Rota do Tunnel

```bash
mkdir -p ~/.cloudflared
```

Criar `~/.cloudflared/config.yml`:

```yaml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: app.previando.com.br
    service: http://localhost:60002
  - hostname: previando.com.br
    service: http://localhost:60001
  - service: http_status:404
```

### 6.4 Configurar DNS

```bash
# O cloudflared cria os registros CNAME automaticamente
cloudflared tunnel route dns previando app.previando.com.br
cloudflared tunnel route dns previando previando.com.br
```

### 6.5 Instalar como Serviço

```bash
cloudflared tunnel install
# Cria systemd service que inicia automaticamente com o sistema

# Verificar
systemctl status cloudflared
```

---

## 6. Nginx (Reverse Proxy Local)

Nginx roda no host, escutando apenas em `127.0.0.1`, sem SSL (TLS é no Cloudflare).

Criar `/etc/nginx/sites-available/previando`:

```nginx
set_real_ip_from 173.245.48.0/20;
set_real_ip_from 103.21.244.0/22;
set_real_ip_from 103.22.200.0/22;
set_real_ip_from 103.31.4.0/22;
set_real_ip_from 141.101.64.0/18;
set_real_ip_from 108.162.192.0/18;
set_real_ip_from 190.93.240.0/20;
set_real_ip_from 188.114.96.0/20;
set_real_ip_from 197.234.240.0/22;
set_real_ip_from 198.41.128.0/17;
set_real_ip_from 162.158.0.0/15;
set_real_ip_from 104.16.0.0/13;
set_real_ip_from 104.24.0.0/14;
set_real_ip_from 172.64.0.0/13;
set_real_ip_from 131.0.72.0/22;
set_real_ip_from 2400:cb00::/32;
set_real_ip_from 2606:4700::/32;
set_real_ip_from 2803:f800::/32;
set_real_ip_from 2405:b500::/32;
set_real_ip_from 2405:8100::/32;
set_real_ip_from 2a06:98c0::/29;
set_real_ip_from 2c0f:f248::/32;
real_ip_header CF-Connecting-IP;

client_max_body_size 15M;
client_body_timeout 60s;

server {
    listen 127.0.0.1:80;
    server_name app.previando.com.br;

    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    location / {
        proxy_pass http://127.0.0.1:60002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}

server {
    listen 127.0.0.1:80;
    server_name previando.com.br www.previando.com.br;

    location / {
        proxy_pass http://127.0.0.1:60001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
```

Ativar:

```bash
ln -sf /etc/nginx/sites-available/previando /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

---

## 7. Firewall

```bash
ufw allow 22/tcp       # SSH
ufw --force enable
```

> Com Cloudflare Tunnel, as portas 80/443 **não precisam** ficar abertas. O tunnel faz conexão de saída para a Cloudflare, não de entrada.

---

## 8. Verificar Tudo

```bash
# Containers
docker compose ps

# Logs da app
docker compose logs app

# Logs do worker
docker compose logs worker

# App respondendo
curl -s -o /dev/null -w "%{http_code}" http://localhost:60002
# Deve retornar 200

# Tunnel ativo
cloudflared tunnel list
# Deve mostrar previando como active

# Logs do tunnel
journalctl -u cloudflared -f
```

---

## 9. Atualizar Código

```bash
cd /opt/apps/projetos_pessoais/previando/app

git pull origin main
docker compose build
docker compose up -d --force-recreate
```

O entrypoint já roda `prisma migrate deploy` + `prisma db seed` automaticamente no startup do container `app`.

---

## 10. Backup Automático

```bash
# Criar diretório de backups
mkdir -p /backups

# Adicionar ao crontab (crontab -e):
0 2 * * * docker exec previando-postgres pg_dump -U previando previando_db | gzip > /backups/previando_db_$(date +\%Y\%m\%d).sql.gz
0 3 * * * find /backups -name "previando_db_*.sql.gz" -mtime +30 -delete
```

---

## 11. Comandos Úteis

```bash
# Logs
docker compose logs -f app
docker compose logs -f worker

# Restart de um serviço
docker compose restart app

# Executar comando dentro do container
docker compose exec app npx prisma studio

# Parar tudo
docker compose down

# Subir tudo (após parar)
docker compose up -d

# Ver imagens e tamanhos
docker images previando-app
```
