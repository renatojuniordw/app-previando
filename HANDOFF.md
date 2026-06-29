# Handoff — Evolução do Previando

> **Data:** 2026-06-29
> **Contexto:** Implementação de 8 fases de evolução do SaaS Previando (advocacia previdenciária brasileira)
> **Status:** 105 testes passando, 0 erros de TypeScript novos (14 erros pré-existentes)

---

## 1. O que foi implementado e por quê

### Fase 1 — Fundação (Qualidade e Infra)

| O quê | Por quê | Arquivos |
|---|---|---|
| **Testes** — ownership, plan-guard, mappers | Áreas críticas sem cobertura | `tests/unit/ownership.test.ts`, `plan-guard.test.ts`, `mappers.test.ts` |
| **CI/CD** — GitHub Actions | Automatizar testes/lint em todo PR | `.github/workflows/ci.yml`, `.github/workflows/e2e.yml` |
| **Zod Validation** — 3 rotas | Gaps de segurança sem validação de body | `portal/simulate`, `webhooks/mercadopago`, `webhooks/trackjud` |
| **Prisma v5/v6** | Inconsistência entre package.json e .vscode | `.vscode/settings.json` |
| **README** | Defasado, não refletia estado atual | `README.md` |
| **Worker Health** | Sem monitoramento dos workers BullMQ | `src/app/api/health/workers/route.ts` |

### Fase 2 — Revisão de Benefícios

| O quê | Por quê | Arquivos |
|---|---|---|
| **3 Estratégias de Revisão** (Vida Toda Tema 1.102, Art. 29 Tema 999, Buraco Negro EC 103) | Tipo `REVISAO_BENEFICIO` existia nos enums mas sem implementação | `src/lib/strategies/revision.ts`, `revision-types.ts`, `registry.ts` |
| **Motor de Comparação** | Compara benefício concedido vs. recalculado com retroativo de 5 anos | `src/lib/revision-engine.ts` |
| **Service Layer** | Orquestra busca de dados, execução e persistência | `src/services/revision-service.ts` |
| **API REST** | `GET/POST /api/cases/{id}/revisions` | `src/app/api/cases/[id]/revisions/route.ts` |
| **Model Prisma** | `Revision`, campos em `PlanLimit` e `UsageRecord` | `prisma/schema.prisma` |
| **Plan Gating** | Feature `REVISION_MODULE` (PRO) | `src/lib/plan-guard.ts` |
| **UI** | Página com formulário, comparativo, histórico | `src/app/(dashboard)/cases/[id]/revisao/page.tsx` |
| **Testes** | 7 testes de engine | `tests/unit/revision-engine.test.ts` |

### Fase 3 — Score de Viabilidade (Determinístico)

| O quê | Por quê | Arquivos |
|---|---|---|
| **Engine de Score** | Score 0-100 combinando elegibilidade, tempo, idade, RMI, consistência CNIS — sem IA | `src/lib/viability-score.ts` |
| **API** | `GET /api/cases/{id}/viability-score` | `src/app/api/cases/[id]/viability-score/route.ts` |
| **Plan Gating** | Feature `VIABILITY_SCORE` (PRO) | `src/lib/plan-guard.ts` |
| **Testes** | 5 testes (score alto, baixo, sem CNIS, ordenação) | `tests/unit/viability-score.test.ts` |

### Fase 4 — Calendário Processual Unificado

| O quê | Por quê | Arquivos |
|---|---|---|
| **API de Calendário** | Eventos dos próximos 90 dias (prazos + Google Calendar + prescrições) | `src/app/api/calendar/route.ts` |
| **UI de Calendário** | Visualização mensal sem dependência externa, filtros por tipo | `src/app/(dashboard)/calendar/page.tsx` |
| **Componente** | Card de evento com estilo por tipo | `src/components/calendar/CalendarEventCard.tsx` |
| **Sincronização Google Calendar** | `syncCaseDeadlinesToCalendar()` no worker de deadlines | `src/services/google-calendar.ts`, `src/jobs/deadline-worker.ts` |
| **Dashboard** | Eventos nos próximos 7 dias no dashboard | `src/app/api/dashboard/summary/route.ts`, `DashboardDeadlines.tsx` |

### Fase 5 — GPS/DAS (Guias de Contribuição)

| O quê | Por quê | Arquivos |
|---|---|---|
| **Engine de Cálculo** | CI (20%/11%), Facultativo (20%/5%), MEI (5% SM), Segurado Especial (2,3%) | `src/lib/gps-engine.ts` |
| **API** | `GET/POST /api/cases/{id}/gps` | `src/app/api/cases/[id]/gps/route.ts` |
| **UI** | Formulário com seleção de categoria/plano, resultado, histórico | `src/app/(dashboard)/cases/[id]/gps/page.tsx` |
| **Model Prisma** | `GpsGuide` | `prisma/schema.prisma` |
| **Plan Gating** | Feature `GPS_MODULE` (todos os planos) | `src/lib/plan-guard.ts` |
| **Testes** | 9 testes (alíquotas, teto, piso, MEI) | `tests/unit/gps-engine.test.ts` |

### Fase 6 — Importação em Lote (CSV + Excel)

| O quê | Por quê | Arquivos |
|---|---|---|
| **Suporte a Excel** | `.xlsx` via pacote `xlsx` + parser CSV existente | `src/app/api/clients/import/route.ts` |
| **Preview** | Validação sem criar registros | `src/app/api/clients/import/preview/route.ts` |
| **UI** | Upload drag-and-drop, preview tabela, progresso, relatório | `src/app/(dashboard)/clients/import/page.tsx` |
| **Template CSV** | Exemplo para download | `public/templates/clientes-import-template.csv` |

### Fase 7 — Relatórios Gerenciais (BI)

| O quê | Por quê | Arquivos |
|---|---|---|
| **API Overview** | KPIs gerais (clientes, casos, cálculos, honorários) | `src/app/api/reports/overview/route.ts` |
| **API Financeiro** | Honorários por mês, receita potencial, ticket médio | `src/app/api/reports/financeiro/route.ts` |
| **API Operacional** | Casos por fase, tempo médio, distribuição por benefício | `src/app/api/reports/operacional/route.ts` |
| **UI de Relatórios** | Gráficos Recharts (barras, pizza, funil, barras horizontais) | `src/app/(dashboard)/reports/page.tsx` |
| **Componentes** | 7 componentes reutilizáveis | `src/components/reports/` |
| **Sidebar** | Link "Relatórios" adicionado | `src/components/Sidebar.tsx` |

### Fase 8 — Assinatura Digital (Clicksign)

| O quê | Por quê | Arquivos |
|---|---|---|
| **Service Layer** | Envio, verificação e download via API Clicksign | `src/services/assinatura-digital.ts` |
| **API** | `GET/POST /api/cases/{id}/assinatura` | `src/app/api/cases/[id]/assinatura/route.ts` |
| **Webhook** | Notificações de conclusão de assinatura | `src/app/api/webhooks/clicksign/route.ts` |
| **UI** | Lista de documentos, modal de envio, download | `src/app/(dashboard)/cases/[id]/assinatura/page.tsx` |
| **Model Prisma** | `Assinatura`, `SIGNATURE_COMPLETED` no enum | `prisma/schema.prisma` |
| **Plan Gating** | Feature `ASSINATURA_DIGITAL` (PRO) | `src/lib/plan-guard.ts` |
| **Layout** | Aba "Assinatura" no caso | `src/app/(dashboard)/cases/[id]/layout.tsx` |

---

## 2. Estado Atual

### ✅ O que funciona

| Métrica | Resultado |
|---|---|
| **Testes** | 105 passando, 10 arquivos |
| **TypeScript** | 14 erros (todos pré-existentes — 0 novos) |
| **Prisma schema** | Válido (`prisma validate` ✅) |
| **Migrations** | 3 criadas: `add_revision_module`, `add_gps_module`, `add_remaining_modules` |
| **Arquivos** | Todos os 47+ arquivos das 8 fases existem |
| **Features implementadas** | 8 fases completas |

### ❌ Erros de TypeScript (14 — todos pré-existentes)

Nenhum erro novo foi introduzido pelas implementações. Os 14 erros restantes são pré-existentes nos seguintes arquivos:

- `PortalConfigCard.tsx` (7 erros)
- `billing/page.tsx` (2 erros)
- `admin/plans/page.tsx` (2 erros)
- `simulations/route.ts` (1 erro)
- `success-analysis/route.ts` (1 erro)
- `retroativo-orchestrator.ts` (1 erro)



### Novas variáveis de ambiente necessárias

| Variável | Feature | Obrigatória? |
|---|---|---|
| `CLICKSIGN_API_KEY` | Assinatura Digital | ❌ (só se usar o módulo) |
| `CLICKSIGN_WEBHOOK_SECRET` | Webhook Clicksign | ❌ |

### Novos pacotes npm

| Pacote | Feature |
|---|---|
| `xlsx` | Importação Excel (já instalado) |

### Workers afetados

O worker de deadlines (`src/jobs/deadline-worker.ts`) agora também sincroniza eventos com Google Calendar. Nenhuma mudança na forma de iniciar (`npm run worker`).
