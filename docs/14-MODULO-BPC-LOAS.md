# 14 — MÓDULO BPC/LOAS
> Previando — Análise Técnica, Documental e Estratégica para BPC/LOAS
> Feature exclusiva SOLO/PRO — via IA (GPT-4o mini)
> Última atualização: 2026-06-27

---

## Contexto e Justificativa

BPC/LOAS (Benefício de Prestação Continuada) depende de:
1. **Critério de renda:** renda familiar per capita ≤ 1/4 do salário mínimo
2. **Critério de deficiência/idade:** impedimento de longo prazo (mínimo 2 anos)
3. **Avaliação biopsicossocial:** baseada na Portaria Conjunta MDS/INSS nº 2/2015 e modelo CIF

---

## O que o Módulo Faz

1. **Pré-analisar a viabilidade do caso**
2. **Analisar laudos médicos** quanto à compatibilidade com a Portaria 2/2015
3. **Gerar perguntas técnicas estruturadas** por domínio da CIF
4. **Entrevista social interativa** — coleta de respostas por domínios CIF
5. **Gerar checklist de documentação**
6. **Relato social editável** — advogado pode ajustar antes de usar

O módulo **não orienta** sobre comportamento do cliente na perícia.

---

## Schema da Entidade

```prisma
model BpcAnalysis {
  id               String         @id @default(cuid())
  caseId           String         @unique
  case             Case           @relation(fields: [caseId], references: [id], onDelete: Cascade)

  patologia        String
  cid              String?
  idade            Int
  faixaEtaria      BpcFaixaEtaria // MENOR_16 | MAIOR_16
  rendaFamiliar    Float
  membrosGrupo     Int
  rendaPerCapita   Float
  barreiras        String?        @db.Text
  resumoLaudos     String?        @db.Text

  preAnalise       String?        @db.Text
  analiseLaudo     String?        @db.Text
  perguntasSocial  String?        @db.Text  // Texto formatado do relato social
  perguntasMedicas String?        @db.Text
  checklist        String?        @db.Text
  relatoSocial     Json?                    // Estrutura JSON editável do relato social

  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  @@map("bpc_analyses")
}

enum BpcFaixaEtaria {
  MENOR_16
  MAIOR_16
}
```

**Campos implementados:**
- `rendaFamiliar` e `rendaPerCapita` usam `Float` (não `Decimal`)
- `relatoSocial` é `Json?` — armazena estrutura editável do relato social
- `perguntasSocial` armazena texto formatado (versão legível)
- `checklist` é `String? @db.Text`

---

## Regras de Negócio

### Critério de renda
```
rendaPerCapita = rendaFamiliar / membrosGrupo
limiteAtual = salarioMinimo / 4  // 2025: R$ 1.518,00 / 4 = R$ 379,50
```

### Faixa etária
- `idade < 16` → MENOR_16: foco em casa, escola, desenvolvimento
- `idade >= 16` → MAIOR_16: foco em trabalho, autonomia, vida comunitária

---

## Fluxo de Uso no App

```
Advogado abre /cases/[id]/bpc
    │
    ▼
Preenche formulário (BpcForm):
  - Patologia + CID + Idade
  - Renda familiar + membros
  - Barreiras + laudos
    │
    ▼
Entrevista Social (BpcSocialInterview):
  - Domínios CIF com perguntas pré-definidas
  - Advogado preenche respostas da entrevista
  - Salva relato social (PATCH /social)
    │
    ▼
Gera análises (cada uma independente):
  [ ] Pré-análise de viabilidade
  [ ] Análise dos laudos (modal com textarea)
  [ ] Relato de Avaliação Social
  [ ] Perguntas para Perícia Médica
  [ ] Checklist de documentação
    │
    ▼
Resultados salvos automaticamente + prontuário
[COPIAR] [EXPORTAR PDF CONSOLIDADO]
```

---

## API Routes

```
GET   /api/cases/:id/bpc              → Retorna análise + clientBirthDate + bpcNotesCount
POST  /api/cases/:id/bpc              → Cria/atualiza formulário (upsert)

POST  /api/cases/:id/bpc/pre-analysis → Gera pré-análise
POST  /api/cases/:id/bpc/laudo        → Analisa laudo médico
POST  /api/cases/:id/bpc/social       → Gera relato social (IA → JSON estruturado)
PATCH /api/cases/:id/bpc/social       → Salva relato social editado
POST  /api/cases/:id/bpc/medical      → Gera perguntas perícia médica
POST  /api/cases/:id/bpc/checklist    → Gera checklist
```

**Observações:**
- `gerarPerguntasSocial` retorna `RelatoSocialFromAI` (JSON com domínios CIF e perguntas)
- `gerarCarrossel` foi **removido** do serviço BPC
- Todas as rotas verificam: auth, ownership, `USE_BPC_MODULE`
- Rate limit: 15 requisições BPC/hora
- Cada geração salva no `BpcAnalysis` + prontuário (`CaseNote` type `BPC_ANALYSIS`)
- `logAudit` nas rotas `pre-analysis` e `laudo`

---

## Funções do Serviço

```typescript
async function gerarPreAnalise(params: BpcAnalysisParams): Promise<string>
async function analisarLaudo(texto: string, params: BpcAnalysisParams): Promise<string>
async function gerarPerguntasSocial(params: BpcAnalysisParams): Promise<RelatoSocialFromAI>  // JSON estruturado
async function gerarPerguntasMedicas(params: BpcAnalysisParams): Promise<string>
async function gerarChecklist(params: BpcAnalysisParams): Promise<string>
```

**Interface `BpcAnalysisParams`:**
```typescript
interface BpcAnalysisParams {
  patologia: string; cid?: string; idade: number
  faixaEtaria: 'MENOR_16' | 'MAIOR_16'
  rendaFamiliar: number; membrosGrupo: number; rendaPerCapita: number
  barreirasRelatadas: string; resumoLaudos?: string
  // Contexto cascateado:
  relatoSocial?: string; preAnalise?: string; analiseLaudo?: string
  perguntasMedicas?: string
}
```

---

## Tipos (types/bpc-social.ts)

```typescript
interface SocialItem { pergunta: string; resposta: string }
interface SocialDominio {
  id: string; categoria: string; titulo: string
  aspectosRelevantes: string; lacunas: string
  itens: SocialItem[]
}
interface RelatoSocial { dominios: SocialDominio[] }

// Formato retornado pela IA
interface SocialDominioFromAI {
  id: string; categoria: string; titulo: string
  aspectosRelevantes: string; lacunas: string
  perguntas: string[]
}
interface RelatoSocialFromAI { dominios: SocialDominioFromAI[] }
```

---

## Helper bpc-notes.ts

```typescript
// Converte JSON estruturado para texto legível
function formatRelatoSocialText(relato: RelatoSocial): string

// Salva no prontuário com type BPC_ANALYSIS
async function saveBpcToNotes(caseId: string, userId: string, tipo: string, content: string): Promise<void>
```

---

## Limites de Plano

| Operação | FREE | SOLO | PRO |
|---|---|---|---|
| Módulo BPC/LOAS | ❌ | ✅ | ✅ |
| Análises BPC/mês | 0 | 50 | -1 (ilimitado) |
| Carrosséis BPC/mês | 0 | 5 | -1 |

---

## Prompts do Sistema

Os prompts completos estão em `src/lib/prompts/bpc/`:
- `pre-analysis.ts` — Pré-análise de viabilidade
- `laudo-analysis.ts` — Análise de laudo médico
- `questions.ts` — Perguntas sociais e médicas (CIF)
- `checklist.ts` — Checklist de documentação

---

## Aviso Legal

Todo resultado gerado pelo módulo BPC/LOAS deve exibir o aviso:

```tsx
<div className="border-4 border-amber-600 bg-amber-50 p-4 mt-6">
  <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-1">
    ⚠️ AVISO IMPORTANTE
  </p>
  <p className="text-xs font-mono font-bold uppercase text-amber-600
                tracking-widest leading-relaxed">
    Este conteúdo é gerado por inteligência artificial...
    A responsabilidade pela estratégia processual é exclusivamente
    do advogado responsável pelo caso. Previando é um produto Unificando.
  </p>
</div>
```
