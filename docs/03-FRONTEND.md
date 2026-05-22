# 03 — FRONTEND
> UI, Kanban, Prontuário, Processo Datajud, Design System Neo-Brutalista

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
├── /dashboard
├── /clients
│   ├── /list                     ← TODOS os clientes
│   │   └── /[id]                 ← Perfil + casos
│   └── /kanban                   ← Apenas com casos
├── /cases/[id]
│   ├── /                         ← Visão geral
│   ├── /notes                    ← Prontuário
│   ├── /process                  ← Consulta Datajud ← novo
│   ├── /cnis
│   ├── /calculator
│   ├── /simulator
│   ├── /retroativos
│   ├── /checklist
│   └── /opinions
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
  { id: 'process',     label: 'PROCESSO',    icon: '⚖️', path: '/process',    plan: 'SOLO' }, // ← novo
  { id: 'cnis',        label: 'CNIS',        icon: '📄', path: '/cnis' },
  { id: 'calculator',  label: 'CALCULADORA', icon: '🧮', path: '/calculator' },
  { id: 'simulator',   label: 'SIMULADOR',   icon: '📊', path: '/simulator',   plan: 'SOLO' },
  { id: 'retroativos', label: 'RETROATIVOS', icon: '💰', path: '/retroativos', plan: 'SOLO' },
  { id: 'checklist',   label: 'CHECKLIST',   icon: '✅', path: '/checklist' },
  { id: 'opinions',    label: 'PARECER',     icon: '🤖', path: '/opinions' },
]
```

---

## Página: /cases/[id]/process — Consulta de Processo

```tsx
// components/process/ProcessConsultPage.tsx
'use client'

export function ProcessConsultPage({ caseId, processNumber, planLimits }: Props) {

  const [result, setResult] = useState<ProcessResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConsult() {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/cases/${caseId}/process`)
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao consultar processo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* ── Explicação contextual ─────────────────────── */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6">
        <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <InfoIcon className="w-4 h-4 text-amber-600" /> O que é a Consulta de Processo?
        </h4>
        <p className="text-sm text-slate-600 leading-relaxed">
          Informe o número CNJ do processo e o Previando consulta
          o andamento no Datajud automaticamente. Receba um resumo
          em linguagem clara — sem precisar abrir o PJe.
        </p>
      </div>

      {/* ── Sem número CNJ salvo ─────────────────────── */}
      {!processNumber ? (
        <ProcessNumberForm caseId={caseId} onSaved={() => router.refresh()} />
      ) : (
        <>
          {/* Número salvo + botão consultar */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-elevation-md p-5 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">
                  Número do Processo (CNJ)
                </p>
                <p className="font-mono font-medium text-slate-900 text-lg">
                  {processNumber}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <FeatureButton
                  feature="USE_DATAJUD"
                  planLimits={planLimits}
                  onClick={handleConsult}
                  disabled={loading}
                >
                  <div className={`bg-slate-900 text-white font-medium text-sm px-6 py-2.5 rounded-md transition-colors flex items-center gap-2
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800'}`}>
                    {loading ? <Spinner className="w-4 h-4" /> : <SearchIcon className="w-4 h-4" />}
                    {loading ? 'Consultando...' : 'Consultar Processo'}
                  </div>
                </FeatureButton>
                <button
                  onClick={() => setEditingNumber(true)}
                  className="text-sm font-medium text-slate-600 border border-slate-300 rounded-md px-4 py-2.5 hover:bg-slate-50 transition-colors">
                  Editar
                </button>
              </div>
            </div>
          </div>

          {/* Erro */}
          {error && (
            <div className="border-4 border-red-600 bg-red-50 p-4 mb-6">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-700 mb-1">
                ⚠️ ERRO NA CONSULTA
              </p>
              <p className="text-xs font-mono font-bold uppercase text-red-600 tracking-widest">
                {error}
              </p>
              {result?.cacheWarning && (
                <p className="text-[9px] font-mono uppercase text-red-400 tracking-widest mt-2">
                  Exibindo última informação disponível em cache.
                </p>
              )}
            </div>
          )}

          {/* Resultado */}
          {result && <ProcessResult result={result} caseId={caseId} clientPhone={clientPhone} />}
        </>
      )}
    </div>
  )
}
```

---

## Componente: ProcessNumberForm

```tsx
// Formulário para salvar o número CNJ
// Chama PATCH /api/cases/:id/process

export function ProcessNumberForm({ caseId, onSaved }: Props) {
  return (
    <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center shadow-sm">
      <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
        <ScaleIcon className="w-6 h-6 text-slate-700" />
      </div>
      <h3 className="text-lg font-serif font-semibold text-slate-900 mb-2">
        Informe o número do processo
      </h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
        Formato CNJ: <span className="font-mono">0001234-55.2024.4.03.6183</span><br/>
        Você encontra esse número no protocolo do INSS ou na distribuição judicial.
      </p>

      <div className="max-w-md mx-auto">
        <input
          type="text"
          placeholder="0000000-00.0000.0.00.0000"
          className="w-full border border-slate-300 rounded-md bg-white px-4 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent transition-colors mb-4"
          onChange={e => setNumber(e.target.value)}
        />
        <button
          onClick={handleSave}
          className="w-full bg-slate-900 text-white font-medium text-sm px-6 py-2.5 rounded-md hover:bg-slate-800 transition-colors">
          Salvar Número do Processo
        </button>
      </div>
    </div>
  )
}
```

---

## Componente: ProcessResult

```tsx
// Exibe o resumo gerado + metadados + botões de ação

export function ProcessResult({ result, caseId, clientPhone }: Props) {

  function handleWhatsApp() {
    const message = buildProcessWhatsAppMessage({
      processNumber: result.processNumber,
      lastMovDate: result.lastMovDate,
      summary: result.summary,
    })
    const url = buildWhatsAppLink(clientPhone, message)
    window.open(url, '_blank')
  }

  function handleCopy() {
    navigator.clipboard.writeText(result.summary)
    toast.success('Resumo copiado!')
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-elevation-md overflow-hidden">

      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <FileTextIcon className="w-4 h-4 text-amber-600" />
            Andamento do Processo
          </span>
          {result.fromCache && (
            <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full">
              Cache
            </span>
          )}
          {result.noChanges && (
            <span className="bg-slate-100 text-slate-600 text-xs font-medium px-2 py-0.5 rounded-full">
              Sem Novidades
            </span>
          )}
        </div>
        <span className="text-xs text-slate-500">
          Atualizado: {formatDateTime(result.lastCheck)}
        </span>
      </div>

      {/* Metadados */}
      <div className="px-5 py-3 border-b-2 border-slate-950 bg-slate-50 flex gap-6 flex-wrap">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">PROCESSO</p>
          <p className="text-xs font-mono font-bold text-slate-950">{result.processNumber}</p>
        </div>
        {result.lastMovDate && (
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">ÚLTIMA MOVIMENTAÇÃO</p>
            <p className="text-xs font-mono font-bold text-slate-950">{formatDate(result.lastMovDate)}</p>
          </div>
        )}
        {result.lastMovCount && (
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">TOTAL MOVIMENTAÇÕES</p>
            <p className="text-xs font-mono font-bold text-slate-950">{result.lastMovCount}</p>
          </div>
        )}
      </div>

      {/* Resumo da IA */}
      <div className="p-5">
        <p className="text-sm font-mono text-slate-950 leading-relaxed whitespace-pre-wrap">
          {result.summary}
        </p>
      </div>

      {/* Aviso obrigatório */}
      <div className="px-5 pb-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">
          ⚠️ Resumo gerado automaticamente via Previando. Para dúvidas jurídicas, consulte o advogado.
        </p>
      </div>

      {/* Ações */}
      <div className="bg-slate-50 border-t border-slate-200 p-4 flex gap-3">
        <button
          onClick={handleCopy}
          className="flex-1 flex justify-center items-center gap-2 bg-white border border-slate-300 text-slate-700 font-medium text-sm py-2.5 rounded-md hover:bg-slate-50 transition-colors">
          <CopyIcon className="w-4 h-4" /> Copiar Resumo
        </button>

        {clientPhone ? (
          <button
            onClick={handleWhatsApp}
            className="flex-1 flex justify-center items-center gap-2 bg-amber-600 text-white font-medium text-sm py-2.5 rounded-md hover:bg-amber-700 transition-colors shadow-sm">
            <WhatsAppIcon className="w-4 h-4" /> Enviar WhatsApp
          </button>
        ) : (
          <div className="relative group flex-1">
            <button
              disabled
              className="w-full flex justify-center items-center gap-2 bg-slate-100 border border-slate-200 text-slate-400 font-medium text-sm py-2.5 rounded-md cursor-not-allowed">
              <WhatsAppIcon className="w-4 h-4" /> Enviar WhatsApp
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
              <div className="bg-slate-800 text-white text-xs px-3 py-2 rounded-md whitespace-nowrap shadow-lg">
                Cadastre o WhatsApp do cliente primeiro
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => handleConsult()}
          className="flex items-center justify-center border border-slate-300 text-slate-600 bg-white px-4 py-2.5 rounded-md hover:bg-slate-50 transition-colors"
          title="Atualizar">
          <RefreshIcon className="w-4 h-4" />
        </button>
      </div>

    </div>
  )
}
```

---

## WhatsApp — Mensagem de Processo

```typescript
// lib/whatsapp.ts

export function buildProcessWhatsAppMessage(data: {
  processNumber: string
  lastMovDate: Date | null
  summary: string
}): string {
  return [
    `⚖️ *Atualização do seu processo*`,
    ``,
    `📋 *Processo:* ${data.processNumber}`,
    data.lastMovDate
      ? `📅 *Última movimentação:* ${formatDate(data.lastMovDate)}`
      : '',
    ``,
    data.summary,
    ``,
    `_Para dúvidas jurídicas, consulte seu advogado._`,
    `_Informação gerada via Previando (app.previando.com.br)_`,
    `_Previando é um produto Unificando_`,
  ].filter(Boolean).join('\n')
}
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

## Regras de UI/UX

1. CPF sempre mascarado: `***.***.**-**`
2. WhatsApp só habilita com `client.phone` preenchido
3. Consulta Datajud: feedback visual claro enquanto carrega (pode demorar até 15s)
4. Cache: badge "CACHE" + "SEM NOVIDADES" quando retornar do cache
5. Erro Datajud: mostrar erro + cache antigo se disponível
6. Número CNJ: validar formato em tempo real no input
7. Prontuário: aviso de imutabilidade no modal de criação
8. Drag & drop Kanban: feedback otimista + rollback em erro
9. PDF FREE: marca d'água
10. Valores: `R$ 3.500,00` | Datas: `dd/MM/yyyy` (pt-BR)
11. Erros: toast com mensagem legível — nunca stack trace
12. Modal upgrade: automático ao receber 402
13. Todas as tabs do caso visíveis — bloqueadas com 🔒 se plano não permite
14. Aba "PROCESSO" aparece com badge 🔒 SOLO para usuários FREE
