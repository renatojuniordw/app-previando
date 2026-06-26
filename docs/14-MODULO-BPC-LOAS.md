# 14 — MÓDULO BPC/LOAS
> Previando — Análise Técnica, Documental e Estratégica para BPC/LOAS
> Feature exclusiva SOLO/PRO — via IA (GPT-4o mini)

---

## Contexto e Justificativa

BPC/LOAS (Benefício de Prestação Continuada) é um dos benefícios mais
disputados e tecnicamente complexos do direito previdenciário. A concessão
depende de:

1. **Critério de renda:** renda familiar per capita ≤ 1/4 do salário mínimo
2. **Critério de deficiência/idade:** impedimento de longo prazo (mínimo 2 anos)
   que obstrua a participação plena na sociedade em igualdade de condições
3. **Avaliação biopsicossocial:** baseada na Portaria Conjunta MDS/INSS nº 2/2015
   e no modelo da Classificação Internacional de Funcionalidade (CIF)

O advogado precisa dominar dois instrumentos de avaliação:
- **Avaliação Social** (assistente social do INSS)
- **Perícia Médica** (perito médico do INSS)

Ambas seguem a Portaria nº 2/2015, com domínios específicos da CIF.

---

## O que o Módulo Faz

O módulo de BPC/LOAS do Previando oferece **análise técnica e documental**
com IA, ajudando o advogado a:

1. **Pré-analisar a viabilidade do caso** antes de abrir processo
2. **Analisar laudos médicos** quanto à compatibilidade com a Portaria 2/2015
3. **Identificar lacunas documentais** que precisam ser corrigidas antes da perícia
4. **Gerar perguntas técnicas estruturadas** por domínio da CIF para cada patologia
5. **Gerar checklist de documentação** por tipo de caso
6. **Gerar conteúdo para redes sociais** sobre temas previdenciários

O módulo **não orienta** sobre comportamento do cliente na perícia,
uso de medicações ou o que omitir ao avaliador.
Essas orientações são de responsabilidade exclusiva do advogado.

---

## Entidade: CaseAnalysis (BPC/LOAS)

Adicionar ao schema Prisma (model separado, vinculado ao Case):

```prisma
model BpcAnalysis {
  id               String         @id @default(cuid())
  caseId           String         @unique
  case             Case           @relation(fields: [caseId], references: [id], onDelete: Cascade)

  // Dados do caso
  patologia        String         // Texto livre: "TDAH", "Esquizofrenia", etc.
  cid              String?        // CID-10: F84.0, F20.0, etc.
  idade            Int            // Idade do cliente em anos
  faixaEtaria      BpcFaixaEtaria // MENOR_16 | MAIOR_16

  // Dados socioeconômicos
  rendaFamiliar    Float          // Armazenado como Float (não Decimal)
  membrosGrupo     Int
  rendaPerCapita   Float          // Calculado automaticamente

  // Barreiras informadas pelo advogado (texto livre, opcional)
  barreiras        String?        @db.Text

  // Laudos e documentos (resumo textual fornecido pelo advogado)
  resumoLaudos     String?        @db.Text

  // Resultados da IA
  preAnalise       String?        @db.Text // Pré-análise de viabilidade
  analiseLaudo     String?        @db.Text // Análise dos laudos
  perguntasSocial  String?        @db.Text // Perguntas por domínio — Avaliação Social (texto formatado)
  perguntasMedicas String?        @db.Text // Perguntas por domínio — Perícia Médica
  checklist        String?        @db.Text // Checklist de documentação
  relatoSocial     Json?          // Relato social estruturado (domínios CIF com itens/respostas)

  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt

  @@map("bpc_analyses")
}

enum BpcFaixaEtaria {
  MENOR_16
  MAIOR_16
}
```

**Notas sobre o schema implementado:**
- `rendaFamiliar` e `rendaPerCapita` usam `Float` (não `Decimal`)
- `barreiras` é opcional (`String?`), não obrigatório
- Não há campos `tokensUsed` nem `generationCostUsd` — o tracking de custos não foi implementado
- `checklist` é `String? @db.Text` (não `Json?`)
- `relatoSocial` é `Json?` — armazena o relato social estruturado por domínios CIF
- `perguntasSocial` armazena o texto formatado do relato social (versão legível), enquanto `relatoSocial` guarda a estrutura JSON editável

---

## Regras de Negócio

### Critério de renda (calculado automaticamente)
```
rendaPerCapita = rendaFamiliar / membrosGrupo
limiteAtual    = salarioMinimo / 4  // 2025: R$ 1.518,00 / 4 = R$ 379,50

Se rendaPerCapita > limiteAtual:
  → aviso: "Renda per capita acima do limite legal.
    Verifique se há possibilidade de exclusão de membros do grupo familiar
    ou outros critérios de miserabilidade (jurisprudência STJ/STF)."
```

### Faixa etária
```
idade < 16 → BpcFaixaEtaria.MENOR_16
  → Prompts focados em: casa, apoio e relacionamento,
    escola, desenvolvimento, impacto na família

idade >= 16 → BpcFaixaEtaria.MAIOR_16
  → Prompts focados em: trabalho, autonomia,
    vida comunitária, atividades da vida diária
```

### Patologias suportadas (com prompts específicos)
```
MENTAL_CRIANCA:     TDAH, autismo, deficiência intelectual (< 16)
MENTAL_ADULTO:      Esquizofrenia, depressão, transtorno bipolar, ansiedade
NEUROLOGICA:        Epilepsia, paralisia cerebral, AVC, demência
ORTOPEDICA:         Amputação, fraturas consolidadas, artrose grave, hérnia
VISUAL:             Baixa visão, cegueira unilateral/bilateral
AUDITIVA:           Surdez, deficiência auditiva severa
MULTIPLA:           Combinação de duas ou mais categorias acima
```

---

## Fluxo de Uso no App

```
Advogado abre o caso → aba "BPC/LOAS"
    │
    ▼
Preenche formulário:
  - Patologia + CID
  - Idade do cliente
  - Renda familiar + membros do grupo
  - Barreiras relatadas (texto livre)
  - Resumo dos laudos disponíveis (texto livre)
    │
    ▼
Sistema calcula renda per capita automaticamente
  → Aviso se acima do limite
    │
    ▼
Advogado seleciona o que quer gerar:
  [ ] Pré-análise de viabilidade
  [ ] Análise dos laudos
  [ ] Perguntas para Avaliação Social (por domínio CIF)
  [ ] Perguntas para Perícia Médica (por domínio CIF)
  [ ] Checklist de documentação
    │
    ▼
IA gera o conteúdo selecionado
    │
    ▼
Advogado lê, ajusta manualmente e usa
    │
    ▼
[ Copiar ] [ Exportar PDF ] [ Salvar no caso ]
```

---

## Prompts do Sistema por Funcionalidade

### A. Pré-análise de Viabilidade

```
System:
"Você é um especialista em direito previdenciário brasileiro com foco em BPC/LOAS.
Analisa casos com base na Portaria Conjunta MDS/INSS nº 2/2015 e no modelo
biopsicossocial da CIF. Seja técnico, objetivo e direto.
Nunca invente informações — use apenas o que foi fornecido.
Se dados insuficientes, aponte explicitamente o que falta."

User:
"Analise a viabilidade deste caso de BPC/LOAS:

Patologia: {patologia} | CID: {cid}
Idade: {idade} anos | Faixa: {faixaEtaria}
Renda familiar: R$ {rendaFamiliar} | Membros: {membrosGrupo}
Renda per capita: R$ {rendaPerCapita}

Barreiras relatadas:
{barreirasRelatadas}

Resumo dos laudos:
{resumoLaudos}

Avalie:
1. Se o caso preenche os critérios legais (renda + impedimento longo prazo)
2. Pontos positivos identificados
3. Pontos críticos ou frágeis
4. Sugestões para robustecer a prova social e médica
5. Lacunas documentais que precisam ser corrigidas
6. Feedback final: viável, frágil ou inviável — com justificativa técnica

Base: Portaria nº 2/2015, modelo biopsicossocial CIF."
```

---

### B. Análise de Laudo Médico

```
System:
"Você é um especialista em análise de documentação médica para fins de BPC/LOAS.
Avalia laudos com base na Portaria nº 2/2015 e na CIF.
Seja direto. Aponte o que está bom e o que está ruim sem enrolação."

User:
"Analise este laudo médico para fins de BPC/LOAS:

Patologia: {patologia} | Faixa etária: {faixaEtaria}

LAUDO:
{textoDoLaudo}

Avalie:
1. O laudo descreve impedimento de longo prazo? (mínimo 2 anos)
2. Há descrição funcional suficiente das limitações?
3. O conteúdo é compatível com os critérios da CIF?
4. A linguagem é compatível com a Portaria nº 2/2015?
5. Há coerência entre medicação prescrita e gravidade do quadro?
6. Menciona barreiras, necessidade de terceiros ou risco social?
7. Pontos positivos e negativos (objetivo e direto)
8. O laudo sustenta o pedido ou precisa de complementação?
9. Como seria o laudo ideal para este caso? (estrutura, conteúdos mínimos)

Classificação final: APTO | PARCIALMENTE APTO | INAPTO — com justificativa."
```

---

### C. Perguntas para Avaliação Social (por domínio CIF)

```
System:
"Você é especialista em avaliação social previdenciária com base na Portaria
nº 2/2015. Gera perguntas técnicas estruturadas por domínio da CIF para
orientar o advogado sobre o que explorar com o cliente antes da avaliação social.
As perguntas são para o ADVOGADO usar ao preparar o cliente — não são scripts
para o cliente decorar respostas."

User:
"Gere perguntas técnicas para a Avaliação Social deste caso de BPC/LOAS:

Patologia: {patologia} | CID: {cid} | Idade: {idade} | Faixa: {faixaEtaria}
Barreiras: {barreirasRelatadas}

Gere no mínimo 8 perguntas por domínio, estruturadas assim:

I. FATORES AMBIENTAIS:
  a) Produtos e Tecnologia
  b) Condições de Habitabilidade e Mudanças Ambientais
  c) Apoio e Relacionamentos
  d) Atitudes (preconceito, estigma)
  e) Serviços, Sistemas e Políticas

II. ATIVIDADES E PARTICIPAÇÃO:
  a) Vida Doméstica
  b) Relações e Interações Interpessoais
  c) Áreas Principais da Vida (escola/trabalho)
  d) Vida Comunitária, Social e Cívica

Para cada domínio:
- Liste as perguntas que o advogado deve explorar
- Indique quais aspectos tendem a ser mais relevantes para esta patologia
- Aponte lacunas de informação se houver

Adapte às especificidades da faixa etária: {faixaEtaria}
{faixaEtaria === 'MENOR_16' ? 'Foco em: casa, escola, apoio familiar, desenvolvimento.' : 'Foco em: trabalho, autonomia, vida comunitária, atividades diárias.'}"
```

---

### D. Perguntas para Perícia Médica (por domínio CIF)

```
System:
"Você é especialista em perícia médica previdenciária com base na Portaria
nº 2/2015 e na CIF. Gera orientações técnicas para o advogado preparar a
perícia médica. As perguntas são para o ADVOGADO entender o que o perito
vai avaliar — não são scripts para o cliente."

User:
"Gere orientações técnicas para a Perícia Médica deste caso:

Patologia: {patologia} | CID: {cid} | Idade: {idade} | Faixa: {faixaEtaria}
Barreiras: {barreirasRelatadas}
Laudos: {resumoLaudos}

Gere entre 20 e 25 perguntas técnicas que o perito tende a fazer,
cobrindo obrigatoriamente:

FUNÇÕES DO CORPO (conforme patologia):
{patologia inclui mental/psiquiátrica?
  'Funções mentais: sono, intelectuais, temperamento, atenção, memória, percepção'
}
{patologia inclui neurológica?
  'Funções neurológicas: consciência, orientação, controle motor, convulsões'
}
{patologia inclui ortopédica?
  'Funções neuromusculoesqueléticas: força, tônus, amplitude, marcha, dor'
}
{patologia inclui visual?
  'Funções sensoriais: acuidade visual, campo visual, sensibilidade à luz'
}

ATIVIDADES E PARTICIPAÇÃO (responsabilidade do perito):
  a) Aprendizagem e Aplicação do Conhecimento
  b) Tarefas e Demandas Gerais
  c) Comunicação
  d) Mobilidade
  e) Cuidado Pessoal

Para cada grupo:
- Aponte o que o perito tende a focar nesta patologia
- Indique quais documentos complementares fortalecem cada aspecto
- Sinalize inconsistências comuns entre queixa e achados clínicos

Adapte para faixa etária: {faixaEtaria}"
```

---

### E. Checklist de Documentação

```
System:
"Gere um checklist objetivo de documentos necessários para instruir
pedido de BPC/LOAS, adaptado à patologia e ao contexto do caso."

User:
"Gere checklist de documentação para BPC/LOAS:

Patologia: {patologia} | CID: {cid} | Faixa: {faixaEtaria}

Liste:
1. Documentos obrigatórios (sem eles o pedido não prospera)
2. Documentos recomendados (fortalecem o caso)
3. Documentos opcionais (podem ajudar em casos específicos)
4. Documentos que frequentemente estão incompletos nesta patologia
5. O que verificar em cada documento antes de juntar ao processo

Formato: lista objetiva, sem enrolação."
```

---

## Geração de Conteúdo para Redes Sociais

Feature adicional: o advogado pode gerar carrosséis educativos sobre BPC/LOAS
para Instagram, com base em temas previdenciários.

```
System:
"Você é especialista em conteúdo jurídico educativo para redes sociais.
Cria carrosséis para Instagram sobre direito previdenciário com linguagem
simples, empática e acessível. Nunca use juridiquês."

User:
"Crie um carrossel de 10 slides sobre: {tema}

Contexto: {resumoDoContexto}

Estrutura obrigatória:
1. Hook (afirmativo, impactante — sem perguntas)
2. Introdução ao problema
3. O contraste
4. O diagnóstico
5. O vilão (barreira principal)
6. A mudança de perspectiva
7. A lição principal
8. Exemplos práticos
9. A oportunidade
10. Call to Action (sem emojis)

Regras:
- Linguagem simples, empática, sem juridiquês
- Sem perguntas no slide 1 e no slide 10
- Emojis apenas em listas comparativas ✅/❌ (máx. 2 slides)
- Objetivo: gerar confiança e identificação — não vender diretamente"
```

---

## API Routes do Módulo

```
── BPC/LOAS ──────────────────────────────────────────────────
GET   /api/cases/:id/bpc                Retorna análise salva + clientBirthDate + bpcNotesCount
POST  /api/cases/:id/bpc                Cria ou atualiza dados do formulário (upsert)

POST  /api/cases/:id/bpc/pre-analysis   Gera pré-análise de viabilidade
POST  /api/cases/:id/bpc/laudo          Analisa laudo médico fornecido
POST  /api/cases/:id/bpc/social         Gera relato social (IA retorna JSON estruturado)
PATCH /api/cases/:id/bpc/social         Salva relato social editado pelo advogado
POST  /api/cases/:id/bpc/medical        Gera perguntas perícia médica
POST  /api/cases/:id/bpc/checklist      Gera checklist de documentação
POST  /api/cases/:id/bpc/social-media   Gera carrossel para redes sociais

── Ferramenta avulsa (não vinculada a caso) ─────────────────
POST  /api/tools/social-media           Gera carrossel BPC (rota independente)
```

**Observações:**
- Todas as rotas verificam: auth, ownership, `USE_BPC_MODULE` (ou `BPC_SOCIAL_MEDIA` para carrossel)
- Rate limit: 15 requisições BPC/hora por usuário (`bpc:${userId}`, 15/3600s)
- Rate limit separado para carrossel: `bpc-social:${userId}`, 15/3600s
- `guardBpcAnalysisLimit` verifica `bpcAnalysesPerMonth` do plano
- `guardBpcSocialMediaLimit` verifica `bpcSocialMediaPerMonth` do plano
- Cada geração salva automaticamente no `BpcAnalysis` e cria registro no prontuário (`CaseNote` com `type: BPC_ANALYSIS`)
- `logAudit` é chamado nas rotas de `pre-analysis` e `laudo`

---

## Limites de Plano

| Operação | FREE | SOLO | PRO |
|---|---|---|---|
| Módulo BPC/LOAS | ❌ | ✅ | ✅ |
| Análise de laudo | ❌ | ✅ | ✅ |
| Geração de perguntas | ❌ | ✅ | ✅ |
| Carrossel para redes | ❌ | Limitado/mês | Ilimitado (-1) |

Campos no `PlanLimit`:
```prisma
bpcEnabled             Boolean @default(false) // SOLO/PRO habilitam o módulo
bpcAnalysesPerMonth    Int     @default(0)     // -1 = ilimitado
bpcSocialMediaPerMonth Int     @default(0)     // -1 = ilimitado
```

Campos no `UsageRecord`:
```prisma
bpcAnalysesThisMonth   Int     @default(0)     // Contador mensal de análises
bpcSocialMediaThisMonth Int    @default(0)     // Contador mensal de carrosséis
```

Funções de guarda em `plan-guard.ts`:
- `guardFeature(plan, 'USE_BPC_MODULE')` — verifica `bpcEnabled`
- `guardFeature(plan, 'BPC_SOCIAL_MEDIA')` — verifica `bpcEnabled`
- `guardBpcAnalysisLimit(userId, plan)` — verifica `bpcAnalysesPerMonth`
- `guardBpcSocialMediaLimit(userId, plan)` — verifica `bpcSocialMediaPerMonth`

---

## Funções do Serviço (services/bpc)

```typescript
// Pré-análise de viabilidade
async function gerarPreAnalise(params: BpcAnalysisParams): Promise<string>

// Análise de laudo médico (recebe texto do laudo + contexto do caso)
async function analisarLaudo(texto: string, params: BpcAnalysisParams): Promise<string>

// Perguntas por domínio — Avaliação Social
// Retorna JSON estruturado (RelatoSocialFromAI), não texto plano
async function gerarPerguntasSocial(params: BpcAnalysisParams): Promise<RelatoSocialFromAI>

// Perguntas por domínio — Perícia Médica
async function gerarPerguntasMedicas(params: BpcAnalysisParams): Promise<string>

// Checklist de documentação
async function gerarChecklist(params: BpcAnalysisParams): Promise<string>

// Carrossel para redes sociais
async function gerarCarrossel(tema: string, contexto: string): Promise<string>
```

**Interface `BpcAnalysisParams`:**
```typescript
interface BpcAnalysisParams {
  patologia: string
  cid?: string
  idade: number
  faixaEtaria: 'MENOR_16' | 'MAIOR_16'
  rendaFamiliar: number
  membrosGrupo: number
  rendaPerCapita: number
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
- **Modelo de IA:** Todas as funções usam `gpt-4o-mini` (hardcoded no serviço)
- **Sanitização:** Todos os inputs passam por `sanitizeForAI()` com limites de caracteres
- **Salário mínimo:** Constante `SALARIO_MINIMO_VIGENTE = 1518.00` (atualizar anualmente)
- **Contexto cascateado:** Cada função recebe resultados de etapas anteriores como contexto adicional, permitindo que a IA refine suas análises com base no que já foi gerado
- **`gerarPerguntasSocial`** retorna `RelatoSocialFromAI` (JSON com domínios CIF e perguntas), que é convertido para `RelatoSocial` (com itens/respostas) antes de salvar no DB
- **`formatRelatoSocialText`** converte o JSON estruturado para texto legível, salvo em `perguntasSocial`

---

## Aviso Legal (obrigatório em todo output)

Todo conteúdo gerado pelo módulo BPC/LOAS deve incluir o aviso abaixo,
renderizado na interface (não no prompt da IA):

```
"Este conteúdo é gerado por inteligência artificial com base nas informações
fornecidas pelo advogado. Não substitui análise jurídica profissional.
A responsabilidade pela estratégia processual é exclusivamente do advogado
responsável pelo caso. Previando é um produto Unificando."
```

**Implementação:** O aviso é renderizado como componente inline em cada tab do `BpcResult`, com estilo `bg-amber-50` e bordas `amber-600`.

---

## Limites Técnicos

| Parâmetro | Valor |
|---|---|
| Modelo | GPT-4o mini |
| Temperatura | 0.3 (análise técnica) / 0.5 (conteúdo social) |
| Max tokens | 3000 (análise completa) / 1500 (checklist) / 2000 (social) |
| Timeout | 45s (análises longas podem demorar) |
| Rate limit | 15 gerações BPC/hora por usuário |

---

## Dependências

Nenhuma dependência nova necessária.
O módulo usa o mesmo cliente OpenAI já configurado em `lib/openai.ts`.
