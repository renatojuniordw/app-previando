# 15 — IMPLEMENTAÇÃO: MÓDULO BPC/LOAS NO PREVIANDO
> Como aplicar o módulo de análise BPC/LOAS dentro do sistema existente

---

## Onde entra no sistema

O módulo BPC/LOAS não é uma área separada do sistema.
Ele vive **dentro do caso**, como mais uma aba — igual ao prontuário,
à calculadora e à consulta de processo.

```
/cases/[id]/bpc   ← nova rota
```

A lógica é simples: o advogado está num caso de BPC/LOAS,
entra na aba, preenche os dados específicos e dispara as análises.
Todo o contexto já está ali — cliente, patologia, prontuário, laudos.

---

## O que muda no sistema existente

### 1. Banco de dados
Adicionar model `BpcAnalysis` ao `schema.prisma` (ver `14-MODULO-BPC-LOAS.md`).
Adicionar campos ao `PlanLimit`:
```prisma
bpcEnabled              Boolean @default(false)
bpcSocialMediaPerMonth  Int     @default(0)  // -1 = ilimitado
```
Atualizar seed: SOLO e PRO recebem `bpcEnabled: true`.

Migration:
```bash
npx prisma migrate dev --name "add_bpc_module"
```

---

### 2. Tipo de benefício que ativa a aba
A aba "BPC/LOAS" só aparece quando `case.benefitType === 'BPC_LOAS'`.
Para outros tipos de benefício, a aba não existe — sem poluir a navegação.

```tsx
// Regra de exibição das tabs do caso
const CASE_TABS = [
  ...tabsPadrão,
  // Aba condicional — só aparece para casos BPC/LOAS
  ...(case.benefitType === 'BPC_LOAS'
    ? [{ id: 'bpc', label: 'BPC/LOAS', icon: '🏛', path: '/bpc', plan: 'SOLO' }]
    : [])
]
```

---

### 3. Nova PlanFeature
Adicionar ao `plan-guard.ts`:

```typescript
export type PlanFeature =
  | ... // features existentes
  | 'USE_BPC_MODULE'       // acesso ao módulo
  | 'BPC_SOCIAL_MEDIA'     // gerador de carrossel

// No switch:
case 'USE_BPC_MODULE':
  if (!limits.bpcEnabled) {
    throw new PlanLimitError(
      feature,
      'Módulo BPC/LOAS disponível a partir do plano SOLO.',
      'SOLO'
    )
  }
  break
```

---

### 4. Rotas de API
Todas sob `/api/cases/[id]/bpc/`:

```
POST   /api/cases/:id/bpc              Cria ou atualiza dados do formulário
GET    /api/cases/:id/bpc              Retorna análise salva
POST   /api/cases/:id/bpc/pre-analysis Gera pré-análise de viabilidade
POST   /api/cases/:id/bpc/laudo        Analisa laudo médico
POST   /api/cases/:id/bpc/social       Gera perguntas avaliação social
POST   /api/cases/:id/bpc/medical      Gera perguntas perícia médica
POST   /api/cases/:id/bpc/checklist    Gera checklist de documentação
POST   /api/cases/:id/bpc/social-media Gera carrossel para Instagram
```

Todas verificam:
1. Auth (sessão válida)
2. Ownership (caso pertence ao usuário)
3. Plano (`USE_BPC_MODULE`)
4. Rate limit: 15 gerações BPC/hora por usuário

---

### 5. Serviço de IA BPC
Criar `services/bpc/index.ts` com as funções:

```typescript
export async function gerarPreAnalise(params: BpcAnalysisParams): Promise<string>
export async function analisarLaudo(laudo: string, params: BpcAnalysisParams): Promise<string>
export async function gerarPerguntasSocial(params: BpcAnalysisParams): Promise<string>
export async function gerarPerguntasMedicas(params: BpcAnalysisParams): Promise<string>
export async function gerarChecklist(params: BpcAnalysisParams): Promise<string>
export async function gerarCarrossel(tema: string, contexto: string): Promise<string>
```

Cada função usa o cliente OpenAI já existente (`lib/openai.ts`).
Os prompts completos estão em `14-MODULO-BPC-LOAS.md`.

Parâmetros compartilhados:
```typescript
interface BpcAnalysisParams {
  patologia: string
  cid?: string
  idade: number
  faixaEtaria: 'MENOR_16' | 'MAIOR_16'
  rendaFamiliar: number
  membrosGrupo: number
  rendaPerCapita: number  // calculado: rendaFamiliar / membrosGrupo
  barreirasRelatadas: string
  resumoLaudos?: string
}
```

---

## Como fica a tela /cases/[id]/bpc

### Estrutura visual (3 blocos)

```
┌─────────────────────────────────────────────────────────┐
│ BLOCO 1 — DADOS DO CASO BPC/LOAS                        │
│                                                         │
│ Patologia + CID | Idade | Faixa etária (auto)           │
│ Renda familiar | Nº membros | Renda per capita (auto)   │
│ ⚠️ Aviso se acima do limite legal                        │
│ Barreiras (textarea)                                    │
│ Resumo dos laudos (textarea)                            │
│                                     [SALVAR DADOS]      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ BLOCO 2 — ANÁLISES COM IA                               │
│                                                         │
│ [🔍 PRÉ-ANÁLISE DE VIABILIDADE]                         │
│ [📋 ANALISAR LAUDO]  ← abre textarea para colar laudo   │
│ [🗣 PERGUNTAS: AVALIAÇÃO SOCIAL]                         │
│ [⚕️ PERGUNTAS: PERÍCIA MÉDICA]                           │
│ [✅ CHECKLIST DE DOCUMENTAÇÃO]                           │
│ [📱 GERAR CARROSSEL INSTAGRAM]  ← plano PRO             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ BLOCO 3 — RESULTADO                                     │
│                                                         │
│ [Conteúdo gerado pela IA aparece aqui]                  │
│                                                         │
│ [📋 COPIAR]  [📄 EXPORTAR PDF]  [💾 SALVAR NO CASO]     │
│                                                         │
│ ⚠️ Aviso legal obrigatório                              │
└─────────────────────────────────────────────────────────┘
```

### Comportamento dos botões de análise
- Cada botão dispara uma chamada separada à API
- Loading state individual por botão
- Resultado aparece sempre no Bloco 3
- Último resultado gerado fica salvo no banco automaticamente
- Botão "Salvar no caso" persiste manualmente se quiser guardar versão específica

### Cálculo automático da renda per capita
```typescript
// Atualiza em tempo real conforme o advogado digita
const rendaPerCapita = rendaFamiliar / membrosGrupo
const limiteAtual = 1518.00 / 4  // 2025: R$ 379,50

// Exibe badge de alerta se acima do limite
if (rendaPerCapita > limiteAtual) {
  // badge vermelho: "R$ {rendaPerCapita} — ACIMA DO LIMITE LEGAL"
  // tooltip: "Verifique possibilidade de exclusão de membros ou
  //           critérios de miserabilidade (STJ/STF)"
} else {
  // badge verde: "R$ {rendaPerCapita} — DENTRO DO LIMITE"
}
```

---

## Análise de Laudo — Fluxo Específico

O laudo não fica salvo no banco (privacidade + tamanho variável).
O advogado cola o texto, a IA analisa, o resultado fica salvo.

```
Advogado clica [ANALISAR LAUDO]
    │
    ▼
Modal abre com textarea
"Cole o texto do laudo aqui (não precisa formatar)"
    │
    ▼
Advogado cola → clica [ANALISAR]
    │
    ▼
API recebe: texto do laudo + params do BpcAnalysis
    │
    ▼
GPT-4o mini analisa conforme prompt do 14-MODULO-BPC-LOAS.md
    │
    ▼
Resultado exibido no Bloco 3:
  - APTO | PARCIALMENTE APTO | INAPTO (badge colorido)
  - Pontos positivos
  - Pontos negativos
  - Como seria o laudo ideal
    │
    ▼
[COPIAR] [EXPORTAR PDF] [SALVAR]
```

---

## Gerador de Carrossel — Fluxo Específico

Feature PRO. Não está vinculada obrigatoriamente a um caso.
Pode ser acessada também em `/tools/social-media` (rota avulsa para PRO).

```
Advogado informa:
  - Tema do carrossel (ex: "BPC/LOAS para crianças com TDAH")
  - Contexto resumido (pode copiar do caso ou digitar livre)
    │
    ▼
IA gera 10 slides estruturados
    │
    ▼
Resultado exibido slide a slide
    │
    ▼
[COPIAR TUDO] [COPIAR SLIDE X] [SALVAR]
```

Limite SOLO: 5 carrosséis/mês
Limite PRO: ilimitado

---

## Aviso Legal — Implementação

Todo resultado gerado pelo módulo BPC/LOAS
deve exibir o aviso abaixo, sem exceção:

```tsx
<div className="border-4 border-amber-600 bg-amber-50 p-4 mt-6">
  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">
    ⚠️ AVISO IMPORTANTE
  </p>
  <p className="text-xs font-mono font-bold uppercase text-amber-600
                tracking-widest leading-relaxed">
    Este conteúdo é gerado por inteligência artificial com base nas
    informações fornecidas. Não substitui análise jurídica profissional.
    A responsabilidade pela estratégia processual é exclusivamente
    do advogado responsável pelo caso.
    Previando é um produto Unificando.
  </p>
</div>
```

---

## Resumo do que criar/modificar

| O que | Arquivo | Ação |
|---|---|---|
| Model BpcAnalysis | `prisma/schema.prisma` | Adicionar |
| Campos PlanLimit | `prisma/schema.prisma` | Adicionar |
| Seed atualizado | `prisma/seed.ts` | Atualizar |
| Migration | terminal | `prisma migrate dev` |
| PlanFeature | `services/billing/plan-guard.ts` | Adicionar |
| Service BPC | `services/bpc/index.ts` | Criar |
| API Routes | `app/api/cases/[id]/bpc/` | Criar (7 rotas) |
| Aba condicional | `app/(dashboard)/cases/[id]/` | Atualizar tabs |
| Página BPC | `app/(dashboard)/cases/[id]/bpc/page.tsx` | Criar |
| Componentes | `components/bpc/` | Criar pasta |
| Rota carrossel avulsa | `app/(dashboard)/tools/social-media/` | Criar (PRO) |
| UsageBar | `components/billing/UsageBar.tsx` | Adicionar linha BPC |

---

## Ordem de implementação sugerida

```
1. Schema + migration + seed
2. PlanFeature + plan-guard
3. Service BPC (prompts + chamadas OpenAI)
4. API Routes (começar por pre-analysis e checklist — mais simples)
5. Página /bpc com formulário e Bloco 1
6. Integrar Bloco 2 (botões) + Bloco 3 (resultado)
7. Análise de laudo (modal + fluxo)
8. Carrossel (deixar por último — é PRO)
9. Aviso legal em todos os outputs
10. Testes com casos reais da sua namorada
```
