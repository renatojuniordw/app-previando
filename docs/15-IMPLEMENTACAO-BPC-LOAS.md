# 15 — IMPLEMENTAÇÃO: MÓDULO BPC/LOAS NO PREVIANDO
> Como aplicar o módulo de análise BPC/LOAS dentro do sistema existente
> Última atualização: 2026-06-27

---

## Onde entra no sistema

O módulo BPC/LOAS vive **dentro do caso**, como aba `/cases/[id]/bpc` e também como drawer (`?drawer=bpc`).

---

## O que foi implementado

### 1. Banco de dados
- Model `BpcAnalysis` com campos: patologia, cid, idade, faixaEtaria, rendaFamiliar, membrosGrupo, rendaPerCapita, barreiras, resumoLaudos, preAnalise, analiseLaudo, perguntasSocial, perguntasMedicas, checklist, **relatoSocial** (Json?)
- Campos no `PlanLimit`: `bpcEnabled`, `bpcAnalysesPerMonth`, `bpcSocialMediaPerMonth`
- Campos no `UsageRecord`: `bpcAnalysesThisMonth`, `bpcSocialMediaThisMonth`

### 2. Tipo de benefício que ativa a aba
A aba "BPC/LOAS" e drawer só aparecem quando `case.benefitType === 'BPC_LOAS'`.

### 3. PlanFeature
`USE_BPC_MODULE` no `plan-guard.ts` mapeia para `bpcEnabled`.

### 4. Rotas de API (8 rotas)
```
GET    /api/cases/:id/bpc              → Retorna análise + clientBirthDate + bpcNotesCount
POST   /api/cases/:id/bpc              → Cria/atualiza fórmula (upsert)
POST   /api/cases/:id/bpc/pre-analysis → Gera pré-análise de viabilidade
POST   /api/cases/:id/bpc/laudo        → Analisa laudo médico
POST   /api/cases/:id/bpc/social       → Gera relato social (IA → JSON)
PATCH  /api/cases/:id/bpc/social       → Salva relato social editado
POST   /api/cases/:id/bpc/medical      → Gera perguntas perícia médica
POST   /api/cases/:id/bpc/checklist    → Gera checklist
```

### 5. Serviço de IA BPC
- Arquivo: `src/services/bpc/index.ts`
- 5 funções: `gerarPreAnalise`, `analisarLaudo`, `gerarPerguntasSocial`, `gerarPerguntasMedicas`, `gerarChecklist`
- Modelo: `gpt-4o-mini` (hardcoded)
- `gerarPerguntasSocial` retorna `RelatoSocialFromAI` (JSON estruturado)
- Contexto cascateado entre funções

### 6. Componentes
- `BpcForm` — formulário de dados do caso
- `BpcResult` — renderização com tabs (Pré-Análise, Laudo, Av. Social, Perícia Médica, Checklist)
- `BpcSocialInterview` — entrevistador social interativo por domínios CIF
- `BpcLaudoModal` — modal para colar texto do laudo
- `BpcConsolidatedPDFDocument` — PDF consolidado (@react-pdf/renderer)

### 7. Tipos
- `src/types/bpc-social.ts`: `RelatoSocial`, `RelatoSocialFromAI`, `SocialDominio`, `SocialItem`

### 8. Helper
- `src/lib/bpc-notes.ts`: `saveBpcToNotes()`, `formatRelatoSocialText()`

### 9. Prompts
- `src/lib/prompts/bpc/`: `pre-analysis.ts`, `laudo-analysis.ts`, `questions.ts`, `checklist.ts`

---

## O que NÃO foi implementado

- **Gerador de Carrossel (`gerarCarrossel`)**: removido do backend. O carrossel para Instagram não é mais gerado via IA.
- **Rota avulsa `/api/tools/social-media`**: removida.
- **Página `/tools/social-media`**: removida da sidebar.

---

## Estrutura visual da página /cases/[id]/bpc

### Bloco 1 — Formulário (`BpcForm`)
- Patologia + CID + Idade (auto ou manual)
- Faixa etária (auto)
- Renda familiar + Nº membros → Renda per capita (auto)
- Badge de alerta se acima do limite legal (1/4 salário mínimo)
- Barreiras (textarea) + Resumo dos laudos (textarea)

### Bloco 2 — Entrevistador Social (`BpcSocialInterview`)
- Interface interativa por domínios CIF
- Domínios: S1-S7 (Sustento, Moradia, Saúde, Educação, Transporte, Comunidade, Proteção Legal)
- Cada domínio tem perguntas pré-definidas com campos de resposta
- Botão "Salvar relato social" → PATCH /social

### Bloco 3 — Abas de análise (`BpcResult`)
- Tabs: Pré-Análise | Laudo | Av. Social | Perícia Médica | Checklist
- Cada tab com botão de geração independente
- Resultado em markdown
- Botões: Copiar, Exportar PDF consolidado
- Modal de laudo para colar texto
- Aviso legal em todas as tabs

---

## Análise de Laudo — Fluxo

```
Advogado clica [ANALISAR LAUDO] (tab "Laudo")
    │
    ▼
Modal abre com textarea
    │
    ▼
Advogado cola texto → [ANALISAR]
    │
    ▼
API: POST /api/cases/:id/bpc/laudo
gpt-4o-mini analisa
    │
    ▼
Resultado: badge (APTO/PARCIALMENTE/INAPTO)
         + pontos positivos/negativos
         + laudo ideal
Salvo em BpcAnalysis + CaseNote
```

---

## Resumo do que existe

| O que | Arquivo | Status |
|---|---|---|
| Model BpcAnalysis | `prisma/schema.prisma` | ✅ |
| Campos PlanLimit | `prisma/schema.prisma` | ✅ |
| Campos UsageRecord | `prisma/schema.prisma` | ✅ |
| Seed atualizado | `prisma/seed.ts` | ✅ |
| PlanFeature | `lib/plan-guard.ts` | ✅ |
| Service BPC | `services/bpc/index.ts` | ✅ |
| Prompts BPC | `lib/prompts/bpc/` | ✅ |
| Tipos BPC | `types/bpc-social.ts` | ✅ |
| Helper notas | `lib/bpc-notes.ts` | ✅ |
| API Routes (8) | `app/api/cases/[id]/bpc/` | ✅ |
| Página BPC | `app/(dashboard)/cases/[id]/bpc/page.tsx` | ✅ |
| Componentes | `components/bpc/` (BpcForm, BpcResult, BpcSocialInterview) | ✅ |
| PDF Consolidado | `components/pdf/BpcConsolidatedPDFDocument.tsx` | ✅ |
| Drawer BPC | `components/case/CaseBpcDrawer.tsx` | ✅ |
| Aviso legal | Inline em BpcResult | ✅ |

### Testes pendentes
- [ ] Testes de integração
- [ ] Testes de limite de plano
- [ ] Testes de rate limit
