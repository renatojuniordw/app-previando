# 07 — ADMIN
> Painel Administrativo — app.previando.com.br/admin

---

## Acesso

- Rota: `app.previando.com.br/admin`
- Requer: `isAdmin: true` no banco + header `x-admin-secret` nas API Routes
- Tornar-se admin (apenas no deploy inicial):
```sql
UPDATE users SET is_admin = true WHERE email = 'seu@previando.com.br';
```

---

## Páginas

```
/admin/dashboard   ← MRR, usuários, custo IA
/admin/users       ← Lista, busca, alterar plano, suspender
/admin/payments    ← Histórico de pagamentos MP
/admin/metrics     ← Uso por feature, custo IA por mês
/admin/plans       ← Editar PlanLimit sem redeploy
```

---

## API Routes Admin

```
GET   /api/admin/metrics          MRR, usuários por plano, custo IA, cases por status
GET   /api/admin/users            Lista paginada (filtros: plan, status, search)
PATCH /api/admin/users/:id/plan   Altera plano manualmente (ex: cortesia, inadimplência)
PATCH /api/admin/users/:id/status Suspende ou reativa usuário
GET   /api/admin/payments         Histórico com filtros
PATCH /api/admin/plans/:plan      Edita limites de PlanLimit sem redeploy
```

---

## Métricas Principais

```typescript
// GET /api/admin/metrics retorna:
{
  users: {
    total: number,
    byPlan: { FREE: number, SOLO: number, PRO: number },
    newThisMonth: number,
  },
  revenue: {
    mrr: number,           // MRR em R$
    totalThisMonth: number,
    totalAllTime: number,
  },
  usage: {
    totalCalculations: number,
    totalOpinions: number,
    aiCostThisMonthUsd: number,
  },
  cases: {
    total: number,
    byStatus: Record<CaseStatus, number>,
  }
}
```

---

## Auditoria

Toda ação admin registrada em `AuditLog`:
- `admin.plan.change` — alteração de plano
- `admin.user.suspend` — suspensão
- `admin.user.activate` — reativação
- `admin.plan.limit.change` — edição de PlanLimit

---

## Segurança do Admin

1. `isAdmin: true` no banco — único ponto de verdade
2. Middleware bloqueia acesso sem flag
3. Header `x-admin-secret` obrigatório nas API Routes
4. Toda ação logada com IP e user-agent
5. Comprometimento: `UPDATE users SET is_admin = false WHERE email = '...'`
