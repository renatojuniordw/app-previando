# 07 — ADMIN
> Painel Administrativo — app.previando.com.br/admin
> Última atualização: 2026-06-27

---

## Acesso

- Rota base: `app.previando.com.br/admin`
- Requer: `isAdmin: true` no banco (autenticação via sessão NextAuth)
- Cache Redis: admin status cacheado por 5 min (`admin:{userId}`)

---

## Middleware de Proteção

O arquivo `src/middleware.ts` aplica duas camadas de segurança:

1. **Autenticação obrigatória** — rotas não-públicas exigem sessão
2. **Verificação de admin** — rotas `/admin/**` e `/api/admin/**` exigem `isAdmin: true`

Além do middleware, cada API route admin também valida com `requireAdmin()` de `src/lib/admin-guard.ts` (defesa em profundidade).

---

## Layout do Admin

Arquivo: `src/app/admin/layout.tsx`

- Server component que verifica `auth()` no lado do servidor
- Sidebar escura (`bg-slate-900`) + header branco
- Botão "Voltar ao App" no rodapé

### Navegação (8 itens)

| Rota | Label | Ícone |
|------|-------|-------|
| `/admin/dashboard` | Dashboard | LayoutDashboard |
| `/admin/users` | Usuários | Users |
| `/admin/payments` | Pagamentos | CreditCard |
| `/admin/metrics` | Métricas | Activity |
| `/admin/plans` | Planos | Package |
| `/admin/salario-minimo` | Salário Mínimo | DollarSign |
| `/admin/modalidades` | Modalidades | Tags |
| `/admin/regras-aposentadoria` | Regras Previdenciárias | BookOpen |

---

## Páginas (9 total)

### `/admin` — Redirecionamento
Redireciona para `/admin/dashboard`.

### `/admin/dashboard` — KPIs
- **KPI Cards** (4 col): MRR, Receita do mês, Total Usuários, Novos este mês
- Usuários por Plano, Uso de IA, Casos por status

### `/admin/users` — Gestão de Usuários
- Busca por nome/email, filtro por plano
- Paginação (20/página)
- Tabela: Usuário, Plano, Clientes, Cadastro, Ações
- Alterar plano (inline select), Suspender/Reativar

### `/admin/payments` — Pagamentos
- Filtro por status, paginação (20/página)
- Tabela: Usuário, Plano, Valor, Status, Data

### `/admin/metrics` — Métricas Detalhadas
- 4 cards grid 2x2: Receita, Usuários, Uso IA, Pipeline Casos

### `/admin/plans` — Edição de PlanLimit
- 3 cards (FREE/SOLO/PRO)
- Campos numéricos + checkboxes de features
- Salva via `PATCH /api/admin/plans/:plan`

### `/admin/modalidades` — CRUD de Modalidades
- Tabela: Código, Nome, Ordem, Ativo, Descrição
- CRUD completo

### `/admin/regras-aposentadoria` — CRUD de Regras
- Agrupadas por modalidade (accordion)
- Upsert por `{ modality, gender, effectiveDate }`

### `/admin/salario-minimo` — CRUD de Salários
- Tabela histórica
- Primeiro registro: badge "Vigente"
- Upsert por `effectiveDate`

---

## API Routes Admin (18 endpoints)

### Métricas
`GET /api/admin/metrics` — Métricas agregadas (users, revenue, usage, cases)

### Usuários
`GET /api/admin/users` — Lista paginada (page, search, plan, status)
`PATCH /api/admin/users/:id/plan` — Altera plano (audit log)
`PATCH /api/admin/users/:id/status` — Suspende/ativa (audit log)

### Pagamentos
`GET /api/admin/payments` — Histórico (page, status)

### Planos
`PATCH /api/admin/plans/:plan` — Edita limites

### Modalidades
`GET /api/admin/modalidades` — Lista (inclui inativas)
`POST /api/admin/modalidades` — Cria (upsert por code)
`PATCH /api/admin/modalidades/:id` — Atualiza
`DELETE /api/admin/modalidades/:id` — Exclui

### Regras de Aposentadoria
`GET /api/admin/regras-aposentadoria` — Lista
`POST /api/admin/regras-aposentadoria` — Cria (upsert)
`PATCH /api/admin/regras-aposentadoria/:id` — Atualiza
`DELETE /api/admin/regras-aposentadoria/:id` — Exclui

### Salário Mínimo
`GET /api/admin/salario-minimo` — Lista
`POST /api/admin/salario-minimo` — Cria (upsert)
`PATCH /api/admin/salario-minimo/:id` — Atualiza
`DELETE /api/admin/salario-minimo/:id` — Exclui

---

## Auditoria

Todas as ações admin sensíveis são registradas via `logAudit()`:

| Ação | Quando | Metadata |
|------|--------|----------|
| `admin.plan.change` | Altera plano | `{ previousPlan, newPlan }` |
| `admin.user.suspend` | Suspende | `{ targetEmail }` |
| `admin.user.activate` | Ativa | `{ targetEmail }` |
| `admin.plan.limit.change` | Edita PlanLimit | `{ changes }` |

---

## Segurança do Admin

1. **`isAdmin: true` no banco** — único ponto de verdade
2. **Middleware** bloqueia acesso sem flag
3. **Validação dupla** — middleware + `requireAdmin()` em cada route
4. **Cache Redis** com TTL de 5 minutos
5. **Toda ação logada** com IP e user-agent
6. **Cache invalidado** em alterações de plano/status
7. **Zod schemas** em todas as rotas CRUD