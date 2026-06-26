# 07 — ADMIN
> Painel Administrativo — app.previando.com.br/admin

---

## Acesso

- Rota base: `app.previando.com.br/admin`
- Requer: `isAdmin: true` no banco (autenticação via sessão NextAuth)
- Tornar-se admin (apenas no deploy inicial):
```sql
UPDATE users SET is_admin = true WHERE email = 'seu@previando.com.br';
```

---

## Middleware de Proteção

O arquivo `src/middleware.ts` aplica duas camadas de segurança:

1. **Autenticação obrigatória** — qualquer rota que não seja pública (`/login`, `/register`, `/api/auth/**`) exige sessão ativa. Sem sessão:
   - Rotas `/api/**` retornam `401`
   - Rotas de página redirecionam para `/login`

2. **Verificação de admin** — rotas começando com `/admin` ou `/api/admin` exigem `isAdmin: true`:
   - Rotas `/api/admin/**` retornam `403` se não for admin
   - Rotas `/admin/**` redirecionam para `/dashboard` se não for admin

```typescript
const ADMIN_ROUTES = ['/admin', '/api/admin']

// Dentro do middleware
if (ADMIN_ROUTES.some((r) => pathname.startsWith(r))) {
  if (!session.user.isAdmin) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
}
```

Além do middleware, cada API route admin também valida com `requireAdmin()` localmente (defesa em profundidade).

---

## Layout do Admin

Arquivo: `src/app/admin/layout.tsx`

- Server component que verifica `auth()` no lado do servidor
- `redirect('/login')` se não há sessão
- `redirect('/dashboard')` se `!session.user.isAdmin`
- Layout com sidebar escura (`bg-slate-900`) + header branco
- Sidebar fixa (`h-screen sticky`) com navegação para todas as páginas admin
- Botão "Voltar ao App" (`/dashboard`) no rodapé da sidebar

### Navegação (8 itens)

| Rota | Label | Ícone |
|------|-------|-------|
| `/admin/dashboard` | Dashboard | `LayoutDashboard` |
| `/admin/users` | Usuários | `Users` |
| `/admin/payments` | Pagamentos | `CreditCard` |
| `/admin/metrics` | Métricas | `Activity` |
| `/admin/plans` | Planos | `Package` |
| `/admin/salario-minimo` | Salário Mínimo | `DollarSign` |
| `/admin/modalidades` | Modalidades | `Tags` |
| `/admin/regras-aposentadoria` | Regras Previdenciárias | `BookOpen` |

---

## Páginas (9 total)

### `/admin` — Redirecionamento

Arquivo: `src/app/admin/page.tsx`

Redireciona imediatamente para `/admin/dashboard`.

### `/admin/dashboard` — KPIs

Arquivo: `src/app/admin/dashboard/page.tsx`

Client component que consome `GET /api/admin/metrics`. Exibe:

- **KPI Cards** (grid 4 colunas): MRR, Receita do mês, Total Usuários, Novos este mês
- **Usuários por Plano**: contagem por FREE, SOLO, PRO
- **Uso de IA**: total de cálculos, pareceres, custo IA/mês (USD)
- **Casos**: total e breakdown por status

### `/admin/users` — Gestão de Usuários

Arquivo: `src/app/admin/users/page.tsx`

Client component com:
- Busca por nome ou email (campo de texto)
- Filtro por plano (select: FREE, SOLO, PRO)
- Paginação (20 por página)
- Tabela com colunas: Usuário (avatar + nome + email), Plano, Clientes, Cadastro, Ações
- **Alterar plano**: select inline que chama `PATCH /api/admin/users/:id/plan`
- **Suspender/Reativar**: botão toggle que chama `PATCH /api/admin/users/:id/status`

### `/admin/payments` — Histórico de Pagamentos

Arquivo: `src/app/admin/payments/page.tsx`

Client component com:
- Filtro por status (select: Todos, Aprovado, Pendente, Falhou, Cancelado)
- Paginação (20 por página)
- Tabela com colunas: Usuário (nome + email), Plano, Valor (BRL), Status (badge colorido), Data
- Badges de status: `APPROVED` (verde), `PENDING` (amarelo), `FAILED` (vermelho), `CANCELLED` (cinza)

### `/admin/metrics` — Métricas Detalhadas

Arquivo: `src/app/admin/metrics/page.tsx`

Client component com 4 cards em grid 2x2:
- **Receita**: MRR, total do mês, total all time
- **Usuários**: total, novos este mês, breakdown por plano
- **Uso de IA**: cálculos totais, pareceres totais, custo IA/mês (destaque amarelo se > $10)
- **Pipeline de Casos**: total e breakdown por status (usa `STATUS_LABELS` de `@/lib/constants`)

### `/admin/plans` — Edição de PlanLimit

Arquivo: `src/app/admin/plans/page.tsx`

Client component com:
- Carrega limites de cada plano via `GET /api/billing/plans?plan={FREE|SOLO|PRO}`
- Grid de 3 cards (um por plano)
- Visualização: max clientes, max cálculos/mês, max pareceres/mês, features toggles
- Edição inline: campos numéricos para limites, checkboxes para features
- Features editáveis: `simulatorEnabled`, `retroativosEnabled`, `exportPdfEnabled`, `whatsappShareEnabled`, `watermarkEnabled`
- Salva via `PATCH /api/admin/plans/:plan`

### `/admin/modalidades` — CRUD de Modalidades

Arquivo: `src/app/admin/modalidades/page.tsx`

Client component com:
- Tabela de modalidades (`ModalityLabel`) usada em cálculos, simulações e regras
- Campos: Código (único, uppercase), Nome exibido, Ordem, Status (Ativa/Inativa), Descrição interna
- Formulário com: código (imutável após criação), label, descrição, ordem, checkbox "ativa"
- Inativar esconde do uso diário sem perder histórico
- CRUD completo: criar, editar, excluir

### `/admin/regras-aposentadoria` — CRUD de Regras Previdenciárias

Arquivo: `src/app/admin/regras-aposentadoria/page.tsx`

Client component com:
- Regras carregadas via `GET /api/admin/regras-aposentadoria`
- Agrupadas por modalidade com seções expansíveis (accordion)
- Campos por regra: Modalidade, Gênero (M/F/AMBOS), Vigência, Idade Mínima, Tempo de Contribuição, Pontos Mínimos, Carência, Descrição, Legislação, Observações
- O engine usa a regra com vigência mais recente anterior à DIB
- Para atualizar uma regra: criar novo registro com mesma modalidade/gênero e vigência futura
- Campos imutáveis após criação: modalidade, gênero, vigência

### `/admin/salario-minimo` — CRUD de Salários Mínimos

Arquivo: `src/app/admin/salario-minimo/page.tsx`

Client component com:
- Tabela histórica de salários mínimos usada nos cálculos previdenciários
- Campos: Vigência (início), Salário Mínimo (R$), Teto RGPS (R$), Legislação, Reajuste (%)
- O sistema busca o valor vigente na DIB do cálculo
- Primeiro registro na lista (mais recente) recebe badge "Vigente"
- Vigência imutável após criação
- CRUD completo: criar, editar, excluir

---

## API Routes Admin (18 endpoints)

Todos os endpoints usam `requireAdmin()` que verifica `session?.user?.isAdmin` e retorna `403` se falhar.

### Métricas

| Método | Rota | Arquivo | Descrição |
|--------|------|---------|-----------|
| `GET` | `/api/admin/metrics` | `src/app/api/admin/metrics/route.ts` | Métricas agregadas do negócio |

**Resposta de `GET /api/admin/metrics`:**
```typescript
{
  users: {
    total: number,
    byPlan: { FREE: number, SOLO: number, PRO: number },
    newThisMonth: number,
  },
  revenue: {
    mrr: number,           // MRR calculado: SOLO * R$299 + PRO * R$599
    totalThisMonth: number, // Soma de pagamentos APPROVED do mês
    totalAllTime: number,   // Soma de todos os pagamentos APPROVED
  },
  usage: {
    totalCalculations: number,
    totalOpinions: number,
    aiCostThisMonthUsd: number,  // Soma de generationCostUsd do mês
  },
  cases: {
    total: number,
    byStatus: Record<string, number>,
  }
}
```

### Usuários

| Método | Rota | Arquivo | Descrição |
|--------|------|---------|-----------|
| `GET` | `/api/admin/users` | `src/app/api/admin/users/route.ts` | Lista paginada de usuários |
| `PATCH` | `/api/admin/users/:id/plan` | `src/app/api/admin/users/[id]/plan/route.ts` | Altera plano do usuário |
| `PATCH` | `/api/admin/users/:id/status` | `src/app/api/admin/users/[id]/status/route.ts` | Suspende ou reativa usuário |

**`GET /api/admin/users`** — Query params:
- `page` (número, padrão 1) — página
- `search` (string) — busca por nome ou email (case-insensitive)
- `plan` (FREE\|SOLO\|PRO) — filtra por plano
- `status` (suspended\|active) — filtra por status
- Limit: 20 por página
- Resposta: `{ users, total, page, pages }`
- Cada user inclui `_count: { clients, cases }`

**`PATCH /api/admin/users/:id/plan`** — Body: `{ plan: 'FREE' | 'SOLO' | 'PRO' }`
- Atualiza `plan` e seta `planStatus` para `'ACTIVE'`
- Invalida cache de `PlanLimit`
- Audit log: `admin.plan.change` com `metadata: { previousPlan, newPlan }`

**`PATCH /api/admin/users/:id/status`** — Body: `{ action: 'suspend' | 'activate' }`
- `'suspend'` seta `planStatus` para `'SUSPENDED'`
- `'activate'` seta `planStatus` para `'ACTIVE'`
- Invalida cache de `PlanLimit`
- Audit log: `admin.user.suspend` ou `admin.user.activate` com `metadata: { targetEmail }`

### Pagamentos

| Método | Rota | Arquivo | Descrição |
|--------|------|---------|-----------|
| `GET` | `/api/admin/payments` | `src/app/api/admin/payments/route.ts` | Histórico de pagamentos |

**`GET /api/admin/payments`** — Query params:
- `page` (número, padrão 1) — página
- `status` (APPROVED\|PENDING\|FAILED\|CANCELLED) — filtra por status
- Limit: 20 por página
- Resposta: `{ payments, total, page, pages }`
- Cada payment inclui `user: { name, email }`

### Planos (PlanLimit)

| Método | Rota | Arquivo | Descrição |
|--------|------|---------|-----------|
| `PATCH` | `/api/admin/plans/:plan` | `src/app/api/admin/plans/[plan]/route.ts` | Edita limites do plano |

**`PATCH /api/admin/plans/:plan`** — Body (todos opcionais):
```typescript
{
  maxClients: number | null,
  maxCalculationsPerMonth: number | null,
  maxOpinionsPerMonth: number | null,
  simulatorEnabled: boolean,
  retroativosEnabled: boolean,
  exportPdfEnabled: boolean,
  whatsappShareEnabled: boolean,
  watermarkEnabled: boolean,
}
```
- `:plan` deve ser `FREE`, `SOLO` ou `PRO`
- Invalida cache de `PlanLimit`
- Audit log: `admin.plan.limit.change` com `metadata: { changes }`

### Modalidades (ModalityLabel)

| Método | Rota | Arquivo | Descrição |
|--------|------|---------|-----------|
| `GET` | `/api/admin/modalidades` | `src/app/api/admin/modalidades/route.ts` | Lista todas as modalidades |
| `POST` | `/api/admin/modalidades` | `src/app/api/admin/modalidades/route.ts` | Cria modalidade (upsert por código) |
| `PATCH` | `/api/admin/modalidades/:id` | `src/app/api/admin/modalidades/[id]/route.ts` | Atualiza modalidade |
| `DELETE` | `/api/admin/modalidades/:id` | `src/app/api/admin/modalidades/[id]/route.ts` | Exclui modalidade |

**`GET /api/admin/modalidades`** — Usa `getModalidades({ includeInactive: true })` de `@/lib/modalidades`
- Resposta: `{ modalidades }`

**`POST /api/admin/modalidades`** — Body (Zod schema):
```typescript
{
  codigo: string,      // obrigatório, mínimo 1 char
  label: string,       // obrigatório, mínimo 1 char
  descricao: string | null,
  ativo: boolean,      // padrão true
  ordem: number,       // inteiro >= 0
}
```
- Faz upsert por `code` (se código já existe, atualiza)
- Retorna `201` com `{ modalidade }`

**`PATCH /api/admin/modalidades/:id`** — Body (todos opcionais):
```typescript
{
  codigo: string,
  label: string,
  descricao: string | null,
  ativo: boolean,
  ordem: number,
}
```

### Regras de Aposentadoria (RetirementRule)

| Método | Rota | Arquivo | Descrição |
|--------|------|---------|-----------|
| `GET` | `/api/admin/regras-aposentadoria` | `src/app/api/admin/regras-aposentadoria/route.ts` | Lista todas as regras |
| `POST` | `/api/admin/regras-aposentadoria` | `src/app/api/admin/regras-aposentadoria/route.ts` | Cria regra (upsert) |
| `PATCH` | `/api/admin/regras-aposentadoria/:id` | `src/app/api/admin/regras-aposentadoria/[id]/route.ts` | Atualiza regra |
| `DELETE` | `/api/admin/regras-aposentadoria/:id` | `src/app/api/admin/regras-aposentadoria/[id]/route.ts` | Exclui regra |

**`GET /api/admin/regras-aposentadoria`** — Ordena por `modality ASC`, `gender ASC`, `effectiveDate DESC`
- Resposta: `{ registros }` com campos normalizados

**`POST /api/admin/regras-aposentadoria`** — Body (Zod schema):
```typescript
{
  modalidade: string,           // obrigatório
  genero: 'M' | 'F' | 'AMBOS', // obrigatório
  vigencia: string,             // YYYY-MM-DD, obrigatório
  idadeMinima: number | null,   // positivo
  tempoContribuicaoAnos: number | null,  // inteiro positivo
  pontosMinimos: number | null,        // inteiro positivo
  carenciaMeses: number | null,        // inteiro positivo
  descricao: string,            // obrigatório
  legislacao: string,           // obrigatório
  observacoes: string | null,
}
```
- Faz upsert por `{ modality, gender, effectiveDate }`
- Retorna `201` com `{ registro }`

**`PATCH /api/admin/regras-aposentadoria/:id`** — Body (todos opcionais):
```typescript
{
  idadeMinima: number | null,
  tempoContribuicaoAnos: number | null,
  pontosMinimos: number | null,
  carenciaMeses: number | null,
  descricao: string,
  legislacao: string,
  observacoes: string | null,
}
```
- Nota: não permite alterar modalidade, gênero ou vigência via PATCH

### Salário Mínimo (MinimumWage)

| Método | Rota | Arquivo | Descrição |
|--------|------|---------|-----------|
| `GET` | `/api/admin/salario-minimo` | `src/app/api/admin/salario-minimo/route.ts` | Lista todos os registros |
| `POST` | `/api/admin/salario-minimo` | `src/app/api/admin/salario-minimo/route.ts` | Cria registro (upsert) |
| `PATCH` | `/api/admin/salario-minimo/:id` | `src/app/api/admin/salario-minimo/[id]/route.ts` | Atualiza registro |
| `DELETE` | `/api/admin/salario-minimo/:id` | `src/app/api/admin/salario-minimo/[id]/route.ts` | Exclui registro |

**`GET /api/admin/salario-minimo`** — Ordena por `effectiveDate DESC`
- Resposta: `{ registros }` com campos normalizados

**`POST /api/admin/salario-minimo`** — Body (Zod schema):
```typescript
{
  vigencia: string,     // YYYY-MM-DD, obrigatório
  valor: number,        // positivo (salário mínimo em R$)
  teto: number,         // positivo (teto previdenciário em R$)
  legislacao: string,   // obrigatório (ex: "Decreto 12.797/2025")
  reajuste: number | null,  // opcional (percentual)
}
```
- Faz upsert por `effectiveDate`
- Retorna `201` com `{ registro }`

**`PATCH /api/admin/salario-minimo/:id`** — Body (todos opcionais):
```typescript
{
  valor: number,
  teto: number,
  legislacao: string,
  reajuste: number | null,
}
```
- Nota: não permite alterar vigência via PATCH

---

## Auditoria

Todas as ações admin sensíveis são registradas na tabela `AuditLog` via `logAudit()` de `src/lib/audit.ts`.

### Como funciona

1. `logAudit()` envia o job para uma fila BullMQ (`audit-log`)
2. O worker (`src/jobs/audit-worker.ts`) processa e escreve no banco
3. Se a fila falha, fallback síncrono (`writeAuditDirect`) escreve diretamente

### Dados capturados

```typescript
{
  userId: string,        // ID do admin que executou a ação
  action: string,        // tipo da ação (veja abaixo)
  resource: string,      // recurso afetado (ex: "user:abc123")
  ipAddress: string | null,  // IP via cf-connecting-ip ou x-forwarded-for
  userAgent: string | null,  // user-agent do request
  metadata: Json,        // dados adicionais específicos da ação
}
```

### Ações registradas

| Ação | Quando | Metadata |
|------|--------|----------|
| `admin.plan.change` | `PATCH /api/admin/users/:id/plan` | `{ previousPlan, newPlan }` |
| `admin.user.suspend` | `PATCH /api/admin/users/:id/status` com `action: 'suspend'` | `{ targetEmail }` |
| `admin.user.activate` | `PATCH /api/admin/users/:id/status` com `action: 'activate'` | `{ targetEmail }` |
| `admin.plan.limit.change` | `PATCH /api/admin/plans/:plan` | `{ changes }` (campos alterados) |

---

## Segurança do Admin

1. **`isAdmin: true` no banco** — único ponto de verdade
2. **Middleware** bloqueia acesso sem flag via sessão NextAuth (`/admin/**` e `/api/admin/**`)
3. **Validação dupla** — cada API route também chama `requireAdmin()` localmente
4. **Toda ação logada** com IP e user-agent na tabela `AuditLog`
5. **Cache invalidado** — alterações de plano ou status invalidam `PlanLimit` cache
6. **Zod schemas** — validação de input em modalidades, regras e salário mínimo
7. **Comprometimento**: `UPDATE users SET is_admin = false WHERE email = '...'`
