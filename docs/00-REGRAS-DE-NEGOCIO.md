# 00 — REGRAS DE NEGÓCIO
> Previando — Glossário, Fluxos, Casos de Uso e Regras para o Agente
> Última atualização: 2026-07-15

---

## Por que este documento existe

Este documento é o **ponto de verdade** sobre o que o Previando faz, como funciona e quais são as regras. Qualquer agente de IA, desenvolvedor ou colaborador deve ler este documento antes de qualquer outro.

---

## 1. Contexto do Produto

O Previando é um SaaS para **advogados previdenciários brasileiros**. O trabalho do advogado envolve:

1. Receber um cliente (segurado) que quer um benefício do INSS
2. Obter o histórico de contribuições (CNIS)
3. Calcular qual benefício tem direito e qual o valor
4. Decidir a melhor estratégia (modalidade)
5. Protocolar o pedido no INSS ou entrar na Justiça
6. Acompanhar o processo até o benefício ser concedido

O Previando automatiza os passos 2, 3 e 4 — e com prontuário, organiza todo o acompanhamento do passo 6.

---

## 2. Glossário

### INSS
Instituto Nacional do Seguro Social. Paga benefícios previdenciários.

### Segurado
Pessoa física que contribuiu para o INSS. No sistema: **Cliente**.

### CNIS
Cadastro Nacional de Informações Sociais. Histórico completo de contribuições. PDF baixado no portal Meu INSS.

### NIT
Número de Inscrição do Trabalhador. Identificador único no INSS.

### Carência
Número mínimo de contribuições para ter direito ao benefício.

### Teto do INSS
Valor máximo de benefício. 2025: R$ 8.157,41.

### Salário de Benefício (SB)
Média dos salários de contribuição. Base do cálculo.

### RMI — Renda Mensal Inicial
Valor do benefício no primeiro pagamento. `SB × Coeficiente`.

### RMA — Renda Mensal Atual
RMI corrigido pelo INPC até hoje.

### DIB — Data de Início do Benefício
Data em que o benefício começa a ser pago.

### Fator Previdenciário
Multiplicador na aposentadoria por tempo de contribuição.

### Retroativos
Valores que o segurado deveria ter recebido mas não recebeu. Corrigido pelo INPC mês a mês.

### EC 103/2019
Emenda Constitucional que reformou a Previdência em novembro de 2019.

### Parecer Preliminar
Rascunho jurídico gerado com IA. Advogado sempre revisa antes de usar.

### Prontuário
Histórico versionado e imutável de anotações de um caso. Cada entrada nunca é editada — só se cria novas.

---



## 3. Entidades do Sistema

### 3.1 Usuário (Advogado)
Profissional que usa o Previando. Tem plano (FREE/SOLO/PRO).

**Recuperação de senha:** fluxo de forgot/reset via email SMTP com nodemailer.

---

### 3.2 Cliente (Segurado)
Pessoa física atendida. Pode ter zero ou mais casos.

**Regra:** Cliente sem caso aparece na lista mas **não no Kanban**.

---

### 3.3 Caso (Processo Previdenciário)
Atendimento específico para um benefício. Um cliente pode ter múltiplos casos.

**Tipos de benefício:**

| Código (DB) | Nome |
|---|---|
| `RETIREMENT_BY_AGE` | Aposentadoria por Idade |
| `RETIREMENT_BY_CONTRIBUTION_TIME` | Aposent. por Tempo de Contribuição |
| `SPECIAL_RETIREMENT` | Aposent. Especial |
| `HYBRID_RETIREMENT` | Aposent. Híbrida |
| `POINTS_RETIREMENT` | Aposent. por Pontos |
| `SICKNESS_BENEFIT` | Auxílio-Doença (B31) |
| `ACCIDENT_BENEFIT` | Auxílio-Acidente (B91) |
| `MATERNITY_PAY` | Salário-Maternidade |
| `PRISONER_BENEFIT` | Auxílio-Reclusão |
| `DEATH_PENSION` | Pensão por Morte |
| `BPC_LOAS` | BPC/LOAS |
| `BENEFIT_REVIEW` | Revisão de Benefício |

**Status do Pipeline (Kanban):**

| Status | Significado |
|---|---|
| `PROSPECTING` | Cliente novo, sem análise |
| `ANALYSIS` | CNIS recebido, calculando |
| `READY_TO_REQUEST` | Cálculo feito, parecer pronto |
| `PROCESSING` | Pedido protocolado, aguardando |
| `FINISHED` | Encerrado |

**Status de processamento do CNIS:**

| Status | Significado |
|---|---|
| `PENDING` | Aguardando processamento |
| `PROCESSING` | Em processamento |
| `SUMMARY_READY` | Resumo pronto (validação rápida) |
| `PROCESSING_DETAILS` | Detalhes em processamento |
| `COMPLETED` | Processamento concluído |
| `FAILED` | Falhou |

---

### 3.4 Prontuário (CaseNote)
Histórico versionado de anotações. Imutável — nunca edita, só cria novas entradas.

**Tipos:**

| Tipo | Ícone | Uso |
|---|---|---|
| `CONTACT` | 🗣 | Ligação, reunião com cliente |
| `DOCUMENT` | 📄 | Recebimento/envio de documentos |
| `LEGAL` | ⚖️ | Decisões, despachos, prazos |
| `INTERNAL` | 📝 | Observação interna do advogado |
| `CALCULATION` | 🧮 | Estratégia de cálculo ou modalidade |
| `PENDING_ISSUE` | ⚠️ | Algo que está faltando ou precisa resolver |
| `BPC_ANALYSIS` | 🏛 | Análise gerada pelo módulo BPC/LOAS |

**Regras:**
- Imutável após criada
- `version` sequencial por caso (1, 2, 3...)
- FREE: máximo 10 entradas por caso
- SOLO/PRO: ilimitado
- Diagnóstico IA (SOLO/PRO): lê todo o prontuário e gera resumo executivo + próximos passos

---

### 3.5 Documento CNIS
PDF do CNIS. Cada caso tem no máximo um CNIS ativo.

**Fluxo híbrido:** Upload → R2 → BullMQ → Parser programático (primeira tentativa) → Validação IA (gpt-4.1-nano) → Se falhar, fallback para processamento IA completo (gpt-4.1-mini) → markdown → banco.

- Quando o parser programático consegue extrair os dados com sucesso e a validação IA confirma: processamento instantâneo.
- Quando o parser programático falha ou a validação IA rejeita: fallback para processamento completo com IA (~1-2 min).
- Fallback OCR: `pdf-parse` → se < 100 chars → `Tesseract.js` (lang: 'por')

---

### 3.6 Cálculo
Resultado de uma modalidade. Imutável após criado. Advogado escolhe o definitivo (`isSelected: true`).

---

### 3.7 Modalidade de Cálculo (Plugin Versionado)
Cada regra previdenciária é um plugin isolado. Vigentes pré-selecionadas. Ver `02-BACKEND.md`.

---

### 3.8 Retroativo
Cálculo de valores não recebidos no passado. INPC mês a mês.

---

### 3.9 Simulação de Cenário
Projeção do benefício em data futura com contribuições futuras simuladas.

---

### 3.10 Checklist de Elegibilidade
Verificação automática dos requisitos. Lógica determinística — IA só explica pendências.

---

### 3.11 Parecer Preliminar
Rascunho gerado pela IA (gpt-4.1-mini). Advogado sempre revisa. Não substitui análise jurídica.

---

### 3.12 Análise BPC/LOAS
Módulo de pré-análise de viabilidade para benefícios BPC/LOAS.

**Campos:**
- Análise de viabilidade do caso
- Análise do laudo médico
- Relato Social (entrevista interativa por domínios CIF)
- Perguntas para perícia médica (domínios CIF)
- Checklist de documentação
- Carrossel para Instagram (ferramenta avulsa)

**Regras:**
- Disponível apenas quando `benefitType === BPC_LOAS`
- Exclusivo dos planos SOLO/PRO
- Modelo de dados: `BpcAnalysis`
- Relato social editável via `PATCH /api/cases/[id]/bpc/social`

---

## 4. Fluxo Completo de Uso

```
PASSO 1 — CADASTRAR CLIENTE
    /clients/list → "Novo Cliente"
    Campos: nome, CPF, data nascimento, email, notas
    Cliente aparece na lista — NÃO no Kanban ainda

PASSO 2 — CRIAR CASO
    Perfil do cliente → "Novo Caso"
    Seleciona tipo de benefício + prazo
    Status: PROSPECTING → aparece no Kanban

PASSO 3 — PRONTUÁRIO (durante todo o caso)
    Aba "Visão Geral" → clicar no FAB ou usar ?drawer=notes
    Tipo + texto livre → salvo, imutável

PASSO 4 — UPLOAD DO CNIS
    Aba CNIS → upload PDF
    Processamento automático (instantâneo com parser programático, ~1-2 min com IA)

PASSO 5 — CALCULAR
    Aba Calculadora → seleciona modalidades → Calcular
    Marca modalidade escolhida
    Caso → status ANALYSIS

PASSO 6 — AÇÕES OPCIONAIS
    → Simular cenários
    → Calcular retroativos
    → Checklist de elegibilidade
    → Gerar parecer com IA
    → Diagnóstico de caso (prontuário + IA)
    → Análise BPC/LOAS (quando benefitType === BPC_LOAS)

PASSO 7 — PROTOCOLAR
    Caso → READY_TO_REQUEST → PROCESSING
    Anotação no prontuário: tipo LEGAL com data de protocolo

PASSO 8 — FINALIZAR
    Caso → FINISHED
    Anotação final no prontuário
```

---

## 5. Regras de Negócio

### 5.1 Clientes vs. Kanban

- `/clients/list`: TODOS os clientes (com e sem caso)
- `/clients/kanban`: apenas com casos ativos
- Switcher visual sempre visível entre as duas visões

### 5.2 Limites de Plano

| Operação | FREE | SOLO | PRO |
|---|---|---|---|
| Clientes | 3 total | 30 total | Ilimitado |
| Cálculos/mês | 5 | Ilimitado | Ilimitado |
| Pareceres IA/mês | 1 | 20 | Ilimitado |
| Prontuário (entradas/caso) | 10 | Ilimitado | Ilimitado |
| Análises BPC/mês | 0 | 50 | Ilimitado |
| Carrosséis BPC/mês | 0 | 5 | Ilimitado |
| Diagnóstico IA | ❌ | ✅ | ✅ |
| Simulador | ❌ | ✅ | ✅ |
| Retroativos | ❌ | ✅ | ✅ |
| Export PDF | ❌ | ✅ | ✅ |
| BPC/LOAS module | ❌ | ✅ | ✅ |
| Marca d'água | ✅ | ❌ | ❌ |

Todo limite verificado no banco via API — retorna 402.

### 5.3 Prontuário — Regras
1. Imutável após criada — nunca editar ou deletar
2. `version` sequencial por caso
3. FREE: máximo 10 por caso
4. Diagnóstico IA: SOLO/PRO apenas

### 5.4 CPF — Privacidade
- Hash HMAC-SHA256 com salt fixo — nunca plain text
- Sempre mascarado na UI: `XXX.***.YYY-**` (primeiros 3 e últimos 3 dígitos visíveis)

### 5.5 PDF com Fallback OCR
`pdf-parse` → se < 100 chars → `Tesseract.js` (lang: 'por')

### 5.7 Recuperação de Senha
- Rota pública `/forgot-password`: usuário informa email → sistema gera token → envia email com link
- Rota pública `/reset-password`: token validado → usuário define nova senha
- Email enviado via nodemailer (SMTP configurável)
- Token expira em 1 hora

### 5.8 Consulta de Processo
- Endpoint: `POST /api/cases/[id]/process`
- Aceita número CNJ (20 dígitos) em qualquer formato
- Cooldown: 10 min entre consultas manuais

### 5.9 Portal do Cliente — Controle de Acesso
O Portal do Cliente permite ao advogado compartilhar dados do caso de forma **granular e segura**:

- **Link único**: token `crypto.randomBytes(32)` (256 bits) com validade de 30 dias
- **Configurável via `portalConfig`**: o advogado ativa/desativa módulos individualmente
- **Dados mínimos**: só expõe o que foi explicitamente autorizado
- **Revogável**: link pode ser invalidado a qualquer momento

**Módulos disponíveis:**
| Módulo | O que expõe | Default |
|---|---|---|
| Acompanhamento processual | Nº processo + movimentações + tribunal | ✅ Ativo |
| Cálculos | RMI, RMA, modalidades | ✅ Ativo |
| Retroativos | Valores financeiros | ❌ Inativo |
| Interpretação IA | Análise textual de urgência | ❌ Inativo |

**Arquitetura:**
```
[Advogado] → PATCH /api/cases/[id]/portal/config → salva portalConfig (JSON no Case)
[Advogado] → POST /api/cases/[id]/portal → gera link 30 dias
[Cliente]  → GET /api/portal/[token] → dados filtrados por portalConfig
```

---

## 6. Empty States Atualizados

| Situação | Mensagem | Ação |
|---|---|---|
| Nenhum cliente | "Cadastre o primeiro segurado para começar." | Cadastrar Cliente |
| Cliente sem caso | "Crie um caso para iniciar o atendimento." | Criar Caso |
| Kanban vazio | "Nenhum caso ativo. Cadastre um cliente e crie um caso." | Ver Clientes |
| CNIS não enviado | "Faça o upload do CNIS para habilitar a calculadora." | Upload CNIS |
| Prontuário vazio | "Registre o primeiro contato com o cliente." | + Anotação |
| Nenhum parecer | "Selecione um cálculo como definitivo para gerar o parecer." | — |
| Portal inativo | "Nenhum link de portal ativo para este caso." | Gerar Link |



## 7. Onboarding — Textos Contextuais

**O que é um "Caso"?**
> Um caso é o atendimento de um cliente para um benefício específico. Cada caso tem seu próprio CNIS, cálculos e prontuário.

**O que é o CNIS?**
> O CNIS é o histórico de contribuições do seu cliente no INSS. Baixe no portal Meu INSS e faça o upload aqui.

**O que é o Prontuário?**
> O diário do caso. Anote ligações, documentos, decisões. Permanente — consulte antes de falar com o cliente. A IA usa suas anotações para gerar diagnósticos.

**O que é RMI e RMA?**
> RMI é o valor no primeiro pagamento. RMA é corrigido pela inflação até hoje.

---

## 8. Marca

- **Produto:** Previando
- **Desenvolvido por:** Unificando (unificando.com.br)
- **Site LP:** previando.com.br
- **App:** app.previando.com.br
- **Email:** contato@previando.com.br
- **Instagram:** @previando
- **Rodapé:** "Previando é um produto Unificando | unificando.com.br"

---

## 9. Dependências (previando-app)

```bash
# Produção
npm install next react react-dom \
  next-auth @auth/prisma-adapter bcryptjs \
  prisma @prisma/client \
  bullmq ioredis \
  pdf-parse tesseract.js pdfkit \
  @aws-sdk/client-s3 @aws-sdk/s3-request-presigner \
  openai mercadopago \
  zod react-hook-form \
  isomorphic-dompurify \
  @dnd-kit/core @dnd-kit/sortable \
  react-markdown recharts \
  zustand lucide-react \
  date-fns date-fns-tz \
  axios nodemailer \
  clsx tailwind-merge

# Dev
npm install --save-dev \
  @types/node @types/react @types/react-dom \
  @types/bcryptjs @types/pdf-parse @types/pdfkit \
  typescript eslint prettier \
  prettier-plugin-tailwindcss \
  ts-node @playwright/test
```
