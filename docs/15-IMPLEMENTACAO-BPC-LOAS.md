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
bpcAnalysesPerMonth     Int     @default(0)  // -1 = ilimitado
bpcSocialMediaPerMonth  Int     @default(0)  // -1 = ilimitado
```
Adicionar campos ao `UsageRecord`:
```prisma
bpcAnalysesThisMonth    Int     @default(0)
bpcSocialMediaThisMonth Int     @default(0)
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

// FEATURE_MAP:
USE_BPC_MODULE: 'bpcEnabled',
BPC_SOCIAL_MEDIA: 'bpcEnabled',

// Funções de guarda:
guardBpcAnalysisLimit(userId, plan)  // verifica bpcAnalysesPerMonth
guardBpcSocialMediaLimit(userId, plan)  // verifica bpcSocialMediaPerMonth
```

**Implementação real:** O `plan-guard.ts` usa `FEATURE_MAP` (Record) para mapear features para campos do `PlanLimit`, e `FEATURE_LABELS` para mensagens de erro. As funções `guardBpcAnalysisLimit` e `guardBpcSocialMediaLimit` verificam o contador mensal via `UsageRecord` e incrementam após uso bem-sucedido.ulo BPC/LOAS disponível a partir do plano SOLO.',
      'SOLO'
    )
  }
  break
```

---

### 4. Rotas de API
Todas sob `/api/cases/[id]/bpc/`:

```
GET    /api/cases/:id/bpc              Retorna análise salva + clientBirthDate + bpcNotesCount
POST   /api/cases/:id/bpc              Cria ou atualiza dados do formulário (upsert)
POST   /api/cases/:id/bpc/pre-analysis Gera pré-análise de viabilidade
POST   /api/cases/:id/bpc/laudo        Analisa laudo médico
POST   /api/cases/:id/bpc/social       Gera relato social (IA retorna JSON estruturado)
PATCH  /api/cases/:id/bpc/social       Salva relato social editado pelo advogado
POST   /api/cases/:id/bpc/medical      Gera perguntas perícia médica
POST   /api/cases/:id/bpc/checklist    Gera checklist de documentação
POST   /api/cases/:id/bpc/social-media Gera carrossel para Instagram

── Ferramenta avulsa (não vinculada a caso) ─────────────────
POST   /api/tools/social-media         Gera carrossel BPC (rota independente)
```

Todas verificam:
1. Auth (sessão válida)
2. Ownership (caso pertence ao usuário) — exceto `/api/tools/social-media`
3. Plano (`USE_BPC_MODULE` ou `BPC_SOCIAL_MEDIA` para carrossel)
4. Rate limit: 15 gerações BPC/hora por usuário (`bpc:${userId}`, 15/3600s)
5. `guardBpcAnalysisLimit` ou `guardBpcSocialMediaLimit` conforme a operação

**Comportamento adicional:**
- Cada geração (exceto carrossel) salva automaticamente no `BpcAnalysis` e cria registro no prontuário (`CaseNote` com `type: BPC_ANALYSIS`)
- `logAudit` é chamado nas rotas de `pre-analysis` e `laudo`
- A rota `PATCH /social` valida o JSON do relato social com Zod schemas (`RelatoSocialSchema`)
- A rota `GET /bpc` retorna também `clientBirthDate` (para cálculo de idade) e `bpcNotesCount` (número de notas BPC no prontuário)

---

### 5. Serviço de IA BPC
Criar `services/bpc/index.ts` com as funções:

```typescript
export async function gerarPreAnalise(params: BpcAnalysisParams): Promise<string>
export async function analisarLaudo(laudo: string, params: BpcAnalysisParams): Promise<string>
export async function gerarPerguntasSocial(params: BpcAnalysisParams): Promise<RelatoSocialFromAI>
export async function gerarPerguntasMedicas(params: BpcAnalysisParams): Promise<string>
export async function gerarChecklist(params: BpcAnalysisParams): Promise<string>
export async function gerarCarrossel(tema: string, contexto: string): Promise<string>
```

Cada função usa o cliente OpenAI já existente (`lib/openai.ts`).
Os prompts completos estão em `lib/prompts/bpc/` (arquivos separados).
**Modelo:** Todas usam `gpt-4o-mini` (hardcoded no serviço).

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
  // Contexto cascateado de etapas anteriores
  relatoSocial?: string
  preAnalise?: string
  analiseLaudo?: string
  perguntasMedicas?: string
}
```

**Detalhes de implementação:**
- `gerarPerguntasSocial` retorna `RelatoSocialFromAI` (JSON estruturado com domínios CIF e perguntas), não texto plano
- Todos os inputs passam por `sanitizeForAI()` com limites de caracteres
- Constante `SALARIO_MINIMO_VIGENTE = 1518.00` (atualizar anualmente)
- **Contexto cascateado:** cada função recebe resultados de etapas anteriores como contexto adicional, permitindo que a IA refine suas análises
- `formatRelatoSocialText` (em `lib/bpc-notes.ts`) converte o JSON estruturado para texto legível
- Tipos em `types/bpc-social.ts`: `RelatoSocial`, `RelatoSocialFromAI`, `SocialDominio`, `SocialDominioFromAI`

---

## Como fica a tela /cases/[id]/bpc

### Estrutura visual (implementada)

A página `/cases/[id]/bpc` é uma `use client` page com 3 seções principais:

**Bloco 1 — Formulário (`BpcForm`):**
- Patologia + CID
- Idade (calculada automaticamente a partir de `clientBirthDate` ou manual)
- Faixa etária (auto: MENOR_16 / MAIOR_16)
- Renda familiar + Nº membros → Renda per capita (calculada automaticamente)
- Badge de alerta se acima do limite legal (1/4 do salário mínimo)
- Barreiras (textarea, opcional)
- Resumo dos laudos (textarea, opcional)
- Botão "Salvar dados"

**Bloco 2 — Entrevistador Social (`BpcSocialInterview`):**
- Interface de entrevista interativa por domínios CIF
- Permite coletar respostas do relato social antes das análises
- Domínios: S1 (Sustento), S2 (Moradia), S3 (Saúde), S4 (Educação), S5 (Transporte), S6 (Comunidade), S7 (Proteção Legal)
- Cada domínio tem perguntas pré-definidas com campos de resposta
- Botão "Salvar relato social"

**Bloco 3 — Abas de análise (`BpcResult`):**
- Tabs: Pré-Análise | Laudo | Av. Social | Perícia Médica | Checklist
- Cada tab tem botão de geração com loading state individual
- Resultado renderizado em markdown
- Botões: Copiar, Exportar PDF (consolidado com todas as análises)
- Modal de laudo para colar texto do laudo médico
- Modal de carrossel para redes sociais

### Comportamento dos botões de análise
- Cada tab dispara uma chamada separada à API
- Loading state individual por botão
- Resultado aparece na tab correspondente
- Último resultado gerado fica salvo no banco automaticamente
- O serviço salva também no `BpcAnalysis` e cria registro no prontuário (`CaseNote`)

### Cálculo automático da renda per capita
```typescript
// Atualiza em tempo real conforme o advogado digita
const rendaPerCapita = rendaFamiliar / membrosGrupo
const limiteAtual = SALARIO_MINIMO_VIGENTE / 4  // 1518.00 / 4 = R$ 379,50

// Exibe badge de alerta se acima do limite
if (rendaPerCapita > limiteAtual) {
  // badge vermelho: "R$ {rendaPerCapita} — ACIMA DO LIMITE LEGAL"
  // tooltip: "Verifique possibilidade de exclusão de membros ou
  //           critérios de miserabilidade (STJ/STF)"
} else {
  // badge verde: "R$ {rendaPerCapita} — DENTRO DO LIMITE"
}
```

### Componentes utilizados
- `BpcForm` — formulário de dados do caso
- `BpcResult` — renderização de resultados com tabs
- `BpcSocialInterview` — entrevistador social interativo
- `BpcConsolidatedPDFDocument` — PDF consolidado com todas as análises

---

## Análise de Laudo — Fluxo Específico

O laudo não fica salvo no banco (privacidade + tamanho variável).
O advogado cola o texto, a IA analisa, o resultado fica salvo.

```
Advogado clica [ANALISAR LAUDO] (na tab "Laudo")
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
gpt-4o-mini analisa conforme prompt em lib/prompts/bpc/laudo-analysis.ts
    │
    ▼
Resultado exibido na tab "Laudo":
  - APTO | PARCIALMENTE APTO | INAPTO (badge colorido)
  - Pontos positivos
  - Pontos negativos
  - Como seria o laudo ideal
    │
    ▼
Resultado salvo automaticamente no BpcAnalysis + CaseNote
[COPIAR] [EXPORTAR PDF]
```

**Detalhes técnicos:**
- Validação Zod: `texto` mínimo 10 caracteres, máximo 10000
- `logAudit` registra a ação no sistema de auditoria
- `saveBpcToNotes` salva no prontuário com `type: BPC_ANALYSIS`

---

## Gerador de Carrossel — Fluxo Específico

Feature SOLO/PRO. Pode ser acessada de duas formas:

1. **Dentro de um caso:** `/api/cases/[id]/bpc/social-media` — vinculado ao caso, com verificação de ownership
2. **Ferramenta avulsa:** `/api/tools/social-media` — sem vínculo a caso, acessível via `/tools/social-media`

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
[COPIAR TUDO] [COPIAR SLIDE X]
```

**Detalhes técnicos:**
- Validação Zod: `tema` mínimo 1, máximo 500 caracteres; `contexto` máximo 3000
- `guardBpcSocialMediaLimit` verifica `bpcSocialMediaPerMonth` do plano
- Contador incrementado via `UsageRecord.bpcSocialMediaThisMonth` (se limite não for -1)
- `logAudit` registra a ação na rota avulsa
- Rate limit: `bpc-social:${userId}`, 15/3600s

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

**Nota:** Na implementação atual, o aviso legal é renderizado como componente inline dentro de cada tab do `BpcResult`, usando classes Tailwind com `bg-amber-50` e bordas `amber-600`.

---

## Resumo do que criar/modificar

| O que | Arquivo | Ação |
|---|---|---|
| Model BpcAnalysis | `prisma/schema.prisma` | Adicionar |
| Campos PlanLimit | `prisma/schema.prisma` | Adicionar (`bpcEnabled`, `bpcAnalysesPerMonth`, `bpcSocialMediaPerMonth`) |
| Campos UsageRecord | `prisma/schema.prisma` | Adicionar (`bpcAnalysesThisMonth`, `bpcSocialMediaThisMonth`) |
| Seed atualizado | `prisma/seed.ts` | Atualizar |
| Migration | terminal | `prisma migrate dev` |
| PlanFeature | `lib/plan-guard.ts` | Adicionar (`USE_BPC_MODULE`, `BPC_SOCIAL_MEDIA`) |
| Funções de guarda | `lib/plan-guard.ts` | `guardBpcAnalysisLimit`, `guardBpcSocialMediaLimit` |
| Service BPC | `services/bpc/index.ts` | Criar |
| Prompts BPC | `lib/prompts/bpc/` | Criar pasta (pre-analysis, laudo-analysis, questions, checklist, carousel) |
| Tipos BPC | `types/bpc-social.ts` | Criar (`RelatoSocial`, `RelatoSocialFromAI`, etc.) |
| Helper de notas | `lib/bpc-notes.ts` | Criar (`saveBpcToNotes`, `formatRelatoSocialText`) |
| API Routes | `app/api/cases/[id]/bpc/` | Criar (8 rotas: GET, POST, pre-analysis, laudo, social, social PATCH, medical, checklist, social-media) |
| Rota carrossel avulsa | `app/api/tools/social-media/` | Criar |
| Página BPC | `app/(dashboard)/cases/[id]/bpc/page.tsx` | Criar |
| Componentes | `components/bpc/` | Criar (`BpcForm`, `BpcResult`, `BpcSocialInterview`) |
| PDF BPC | `components/pdf/BpcConsolidatedPDFDocument.tsx` | Criar |
| Rota avulsa social-media | `app/(dashboard)/tools/social-media/` | Criar página |
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
8. Carrossel (deixar por último — é SOLO/PRO)
9. Aviso legal em todos os outputs
10. Testes com casos reais
```

## Checklist de implementação

- [x] Schema atualizado (BpcAnalysis + PlanLimit + UsageRecord)
- [x] Migration criada e aplicada
- [x] Seed atualizado (SOLO/PRO com bpcEnabled)
- [x] plan-guard.ts atualizado (FEATURE_MAP, guardBpcAnalysisLimit, guardBpcSocialMediaLimit)
- [x] services/bpc/index.ts criado com todas as funções
- [x] Prompts em lib/prompts/bpc/ (pre-analysis, laudo-analysis, questions, checklist, carousel)
- [x] Tipos em types/bpc-social.ts
- [x] Helper lib/bpc-notes.ts (saveBpcToNotes, formatRelatoSocialText)
- [x] Rotas de API criadas (8 rotas sob /api/cases/[id]/bpc/ + 1 rota avulsa)
- [x] Tabs do caso atualizadas (condicional BPC_LOAS)
- [x] Página /cases/[id]/bpc criada (use client, com BpcForm, BpcResult, BpcSocialInterview)
- [x] Componentes BpcForm, BpcResult, BpcSocialInterview criados
- [x] PDF BpcConsolidatedPDFDocument criado
- [x] Rota /tools/social-media criada (SOLO/PRO)
- [x] UsageBar atualizado
- [ ] Testes de integração
- [ ] Testes de limite de plano
- [ ] Testes de rate limit
