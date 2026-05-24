# 00 — REGRAS DE NEGÓCIO
> Previando — Glossário, Fluxos, Casos de Uso e Regras para o Agente

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

---

### 3.2 Cliente (Segurado)
Pessoa física atendida. Pode ter zero ou mais casos.

**Regra:** Cliente sem caso aparece na lista mas **não no Kanban**.

---

### 3.3 Caso (Processo Previdenciário)
Atendimento específico para um benefício. Um cliente pode ter múltiplos casos.

**Tipos de benefício:**

| Código | Nome |
|---|---|
| `APOSENTADORIA_IDADE` | Aposentadoria por Idade |
| `APOSENTADORIA_TEMPO_CONTRIBUICAO` | Aposent. por Tempo de Contribuição |
| `APOSENTADORIA_ESPECIAL` | Aposent. Especial |
| `APOSENTADORIA_HIBRIDA` | Aposent. Híbrida |
| `APOSENTADORIA_PONTOS` | Aposent. por Pontos |
| `AUXILIO_DOENCA` | Auxílio-Doença (B31) |
| `AUXILIO_ACIDENTE` | Auxílio-Acidente (B91) |
| `SALARIO_MATERNIDADE` | Salário-Maternidade |
| `AUXILIO_RECLUSAO` | Auxílio-Reclusão |
| `PENSAO_POR_MORTE` | Pensão por Morte |
| `BPC_LOAS` | BPC/LOAS |
| `REVISAO_BENEFICIO` | Revisão de Benefício |

**Status do Pipeline (Kanban):**

| Status | Significado |
|---|---|
| `PROSPECCAO` | Cliente novo, sem análise |
| `ANALISE` | CNIS recebido, calculando |
| `PRONTO_PARA_REQUERER` | Cálculo feito, parecer pronto |
| `EM_PROCESSAMENTO` | Pedido protocolado, aguardando |
| `FINALIZADO` | Encerrado |

**Prioridade automática (job diário):**
- 🔴 CRITICAL: prazo ≤ 7 dias
- 🟡 ATTENTION: 8–30 dias
- 🟢 NORMAL: >30 dias ou sem prazo

---

### 3.4 Prontuário (CaseNote)
Histórico versionado de anotações. Imutável — nunca edita, só cria novas entradas.

**Tipos:**

| Tipo | Ícone | Uso |
|---|---|---|
| `CONTATO` | 🗣 | Ligação, reunião, WhatsApp com cliente |
| `DOCUMENTO` | 📄 | Recebimento/envio de documentos |
| `JURIDICO` | ⚖️ | Decisões, despachos, prazos |
| `INTERNO` | 📝 | Observação interna do advogado |
| `CALCULO` | 🧮 | Estratégia de cálculo ou modalidade |
| `PENDENCIA` | ⚠️ | Algo que está faltando ou precisa resolver |

**Regras:**
- Imutável após criada
- `version` sequencial por caso (1, 2, 3...)
- FREE: máximo 10 entradas por caso
- SOLO/PRO: ilimitado
- Diagnóstico IA (SOLO/PRO): lê todo o prontuário e gera resumo executivo + próximos passos

---

### 3.5 Documento CNIS
PDF do CNIS. Cada caso tem no máximo um CNIS ativo.

**Fluxo:** Upload → R2 → BullMQ → `pdf-parse` (se < 100 chars → Tesseract OCR) → `gpt-4.1-mini` → markdown → banco.

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
Projeção do benefício em data futura.

---

### 3.10 Checklist de Elegibilidade
Verificação automática dos requisitos. Lógica determinística — IA só explica pendências.

---

### 3.11 Parecer Preliminar
Rascunho gerado pela IA. Advogado sempre revisa. Não substitui análise jurídica.

---

## 4. Fluxo Completo de Uso

```
PASSO 1 — CADASTRAR CLIENTE
    /clients/list → "Novo Cliente"
    Campos: nome, CPF, data nascimento, WhatsApp, email, notas
    Cliente aparece na lista — NÃO no Kanban ainda

PASSO 2 — CRIAR CASO
    Perfil do cliente → "Novo Caso"
    Seleciona tipo de benefício + prazo
    Status: PROSPECCAO → aparece no Kanban

PASSO 3 — PRONTUÁRIO (durante todo o caso)
    Aba "Prontuário" → + Nova Anotação
    Tipo + texto livre → salvo, imutável

PASSO 4 — UPLOAD DO CNIS
    Aba CNIS → upload PDF
    Processamento automático (~1-2 min)

PASSO 5 — CALCULAR
    Aba Calculadora → seleciona modalidades → Calcular
    Marca modalidade escolhida
    Caso → status ANALISE

PASSO 6 — AÇÕES OPCIONAIS
    → Simular cenários
    → Calcular retroativos
    → Checklist de elegibilidade
    → Gerar parecer com IA
    → Diagnóstico de caso (prontuário + IA)

PASSO 7 — PROTOCOLAR
    Caso → PRONTO_PARA_REQUERER → EM_PROCESSAMENTO
    Anotação no prontuário: tipo JURIDICO com data de protocolo

PASSO 8 — FINALIZAR
    Caso → FINALIZADO
    Anotação final no prontuário
    PDF CNIS deletado do R2 após 90 dias
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
| Diagnóstico IA | ❌ | ✅ | ✅ |
| Simulador | ❌ | ✅ | ✅ |
| Retroativos | ❌ | ✅ | ✅ |
| Export PDF | ❌ | ✅ | ✅ |
| WhatsApp share | ❌ | ✅ | ✅ |
| Marca d'água | ✅ | ❌ | ❌ |

Todo limite verificado no banco via API — retorna 402.

### 5.3 Prontuário — Regras
1. Imutável após criada — nunca editar ou deletar
2. `version` sequencial por caso
3. FREE: máximo 10 por caso
4. Diagnóstico IA: SOLO/PRO apenas

### 5.4 CPF — Privacidade
- Hash HMAC-SHA256 com salt fixo — nunca plain text
- Sempre mascarado na UI: `***.***.**-**`

### 5.5 WhatsApp Share
- Formato: `5511999999999`
- Link: `https://wa.me/{phone}?text={mensagem}`
- Rodapé: "Informação gerada via Previando"

### 5.6 PDF com Fallback OCR
`pdf-parse` → se < 100 chars → `Tesseract.js` (lang: 'por')

---

## 6. Empty States

| Situação | Mensagem | Ação |
|---|---|---|
| Nenhum cliente | "Cadastre o primeiro segurado para começar." | Cadastrar Cliente |
| Cliente sem caso | "Crie um caso para iniciar o atendimento." | Criar Caso |
| Kanban vazio | "Nenhum caso ativo. Cadastre um cliente e crie um caso." | Ver Clientes |
| CNIS não enviado | "Faça o upload do CNIS para habilitar a calculadora." | Upload CNIS |
| Prontuário vazio | "Registre o primeiro contato com o cliente." | + Anotação |
| Nenhum parecer | "Selecione um cálculo como definitivo para gerar o parecer." | — |

---

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
  pdf-parse tesseract.js \
  @aws-sdk/client-s3 @aws-sdk/s3-request-presigner \
  openai mercadopago \
  isomorphic-dompurify \
  @dnd-kit/core @dnd-kit/sortable \
  react-hook-form zod zustand recharts axios \
  date-fns

# Dev
npm install --save-dev \
  @types/node @types/react @types/react-dom \
  @types/bcryptjs @types/pdf-parse \
  typescript eslint prettier
```
