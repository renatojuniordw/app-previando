# 03 — FRONTEND
> UI, Kanban, Prontuário, Design System Neo-Brutalista

---

## Princípios

- Design System: Premium Legal Design (ver `11-DESIGN-SYSTEM.md`)
- Nunca chamar banco diretamente — só via API Routes
- Interceptar `402` globalmente → modal de upgrade automático
- Barra de uso sempre visível
- Features bloqueadas: 🔒 + tooltip
- Empty states claros com ação contextual

---

## Estrutura de Rotas

```
/(dashboard)
├── /dashboard                    ← Métricas com recharts (BarChart, PieChart, RMI stats)
├── /deadlines                    ← Prazos dos próximos 30 dias (grupos: atrasados, urgentes, próximos)
├── /activity                     ← Log de atividades paginado (AuditLog)
├── /clients
│   ├── /list                     ← TODOS os clientes
│   │   └── /[id]                 ← Perfil + casos
│   └── /kanban                   ← Apenas com casos
├── /cases                        ← Busca global de casos com filtros avançados
├── /cases/[id]
│   ├── /                         ← Visão geral
│   ├── /notes                    ← Prontuário
│   ├── /cnis
│   ├── /calculator
│   ├── /simulator
│   ├── /retroativos
│   ├── /checklist
│   ├── /opinions
│   └── /compare                  ← Comparativo de todas as modalidades × 2 gêneros (botão "Exportar PDF")
└── /settings
    ├── /profile
    └── /billing
```

---

## Tabs de Navegação do Caso

```tsx
const CASE_TABS = [
  { id: 'overview',    label: 'VISÃO GERAL', icon: '📋', path: '' },
  { id: 'notes',       label: 'PRONTUÁRIO',  icon: '🗣', path: '/notes' },
  { id: 'cnis',        label: 'CNIS',        icon: '📄', path: '/cnis' },
  { id: 'calculator',  label: 'CALCULADORA', icon: '🧮', path: '/calculator' },
  { id: 'simulator',   label: 'SIMULADOR',   icon: '📊', path: '/simulator',   plan: 'SOLO' },
  { id: 'retroativos', label: 'RETROATIVOS', icon: '💰', path: '/retroativos', plan: 'SOLO' },
  { id: 'checklist',   label: 'CHECKLIST',   icon: '✅', path: '/checklist' },
  { id: 'opinions',    label: 'PARECER',     icon: '🤖', path: '/opinions' },
  { id: 'compare',     label: 'COMPARAR',    icon: '⚖️', path: '/compare' },  // todas as modalidades
]
// BPC_LOAS: tab extra "BPC/LOAS" inserida dinamicamente se benefitType === 'BPC_LOAS'
```

---

## Duas Visões de Clientes

```tsx
// Switcher sempre visível (Premium UI)
<div className="flex bg-slate-100 p-1 rounded-lg w-fit mb-6">
  <a href="/clients/list"
     className={`px-6 py-2 text-sm font-medium rounded-md transition-all
       ${view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
    Clientes ({totalClients})
  </a>
  <a href="/clients/kanban"
     className={`px-6 py-2 text-sm font-medium rounded-md transition-all
       ${view === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
    Kanban ({totalCasesActive})
  </a>
</div>
```

---

## Interceptor Global de 402

```typescript
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 402) {
      const { error, feature, upgradeRequired } = err.response.data
      useUpgradeModal.getState().open({ message: error, feature, upgradeRequired })
    }
    return Promise.reject(err)
  }
)
```

---

## Sidebar — Navegação Principal

```
LayoutDashboard  → /dashboard
Users            → /clients/list
Columns          → /clients/kanban
FolderOpen       → /cases            ← busca global de casos com filtros
Calendar         → /deadlines        ← prazos dos próximos 30 dias
Activity         → /activity         ← log de atividades
CreditCard       → /settings/billing
Settings         → /settings/profile
```

## Header — Bell de Notificações

- Polling a cada 60s em `GET /api/notifications`
- Badge vermelho com contagem de não-lidas
- Dropdown com lista (tipo, mensagem, data, link para o caso)
- Clique na notificação → `POST /api/notifications/:id/read` + navega para o caso
- Tipos: `DEADLINE_7D`, `DEADLINE_3D`, `DEADLINE_1D`, `CNIS_PROCESSED`, `CNIS_FAILED`, `PLAN_LIMIT_NEAR`

---

## Regras de UI/UX

1. CPF sempre mascarado: `***.***.**-**`
2. WhatsApp só habilita com `client.phone` preenchido
3. Prontuário: aviso de imutabilidade no modal de criação
4. Drag & drop Kanban: feedback otimista + rollback em erro
5. PDF FREE: marca d'água
6. Valores: `R$ 3.500,00` | Datas: `dd/MM/yyyy` (pt-BR)
7. Erros: toast com mensagem legível — nunca stack trace
8. Modal upgrade: automático ao receber 402
9. Todas as tabs do caso visíveis — bloqueadas com 🔒 se plano não permite
10. **Zero processamento matemático no cliente:** As views de Cálculos, Simulação e Retroativos atuam estritamente como coletores de parâmetros de input e renderizadores da memória de cálculo detalhada gerada e blindada de forma 100% segura pelo backend.

