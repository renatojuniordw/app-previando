# 13 — LANDING PAGE — Estratégia de Vendas e Persuasão
> previando.com.br — Copywriting, Funil de Conversão e Arquitetura de Persuasão
> Stack: React (Vite) + Tailwind CSS — repo: previando-web — porta 60001
> Design System: ver 12-DESIGN-SYSTEM-LP.md
> Status: Especificação para construção da LP

---

## Filosofia de Vendas

A LP do Previando não é um catálogo de funcionalidades. É uma **máquina de conversão** construída sobre:

1. **AIDA** — Atenção → Interesse → Desejo → Ação
2. **PAS** — Problema → Agitação → Solução
3. **Custo de oportunidade** — Mostrar o quanto o advogado PERDE não usando a ferramenta
4. **Prova social real** — Sem depoimentos inventados. Sem logos falsos.
5. **Gratuidade como porta de entrada** — O FREE existe para vender o SOLO

### Funil de Conversão

```
Tráfego Pago (Meta/Google)
       ↓
  previando.com.br
       ↓
  CTA → app.previando.com.br/register
       ↓
  Usuário FREE → bate no limite → upgrade SOLO/PRO
```

**Regra de ouro:** A LP nunca vende o plano pago diretamente. Ela vende o **teste grátis**. O produto vende sozinho quando o advogado experimenta e bate no limite.

---

## Arquitetura de Persuasão (Ordem das Seções)

```
1. NAVBAR         → Navegação + CTA "Ver Demonstração"
2. HERO           → Atenção: dor + promessa + CTA
3. DORES          → Agitação: o custo de não usar
4. COMO FUNCIONA  → Solução: 3 passos simples
5. FUNCIONALIDADES → Desejo: tudo que ele ganha
6. PROVA SOCIAL   → Credibilidade: números reais
7. PLANOS         → Decisão: preço justo vs. custo de oportunidade
8. FAQ            → Objeções: responde dúvidas
9. CTA FINAL      → Ação: última chance de converter
10. FOOTER        → Fechamento
```

---

## Copywriting — Tom de Voz

**Tom:** Consultivo, seguro, direto. Não é startup genérica — é ferramenta jurídica.

| Situação | Tom | Exemplo |
|---|---|---|
| Hero | Impacto + promessa | "Você ainda calcula aposentadoria de cliente no Excel?" |
| Dores | Empático + urgente | "Cada erro de cálculo pode custar milhares em honorários." |
| Funcionalidades | Técnico + benefício | "Leitura automática do CNIS com IA — sem digitação manual." |
| Planos | Justo + âncora | "Menos de R$ 3,50 por dia para transformar seu escritório." |

**Evitar:**
- "Revolucionário", "disruptivo", "game changer" — palavras gastas
- Dados inventados ("90% dos advogados...")
- Depoimentos sem autorização real

**Usar:**
- Verbos no presente: "calcula", "extrai", "gera"
- Segunda pessoa: "você", "seu escritório"
- Especificidade: "14 modalidades", "5 etapas no Kanban", "3 clientes grátis"

---

## Seção 1 — Navbar

**Função no funil:** Navegação + âncora de CTA para quem já está pronto.

```
[Logo Previando] — [Funcionalidades] [Planos] [Sobre] [Blog]
                  — [Entrar] [Ver Demonstração →]

Comportamento:
- Sticky no topo, z-50, bg-white com sombra sutil ao scroll
- "Entrar": link para app.previando.com.br/login
- "Ver Demonstração": CTA laranja → app.previando.com.br/register

Mobile:
- Hamburger menu com drawer lateral
- CTA no final do drawer
```

---

## Seção 2 — Hero (Atenção)

**Função no funil:** Prender a atenção em 3 segundos. Dor + Promessa + Prova.

### Copy

```
Badge pill:   "Novo — Calculadora com IA para Previdenciário"

Display:      "Inteligência Previdenciária"
H1:           "para Advogados"

Lead:         "A única plataforma construída especificamente para
              advogados previdenciários. Faça o upload do CNIS e receba
              o cálculo completo — RMI, RMA, retroativos e parecer —
              em minutos, não em horas."

CTA:          "Começar Gratuitamente →"
              URL: app.previando.com.br/register

Trust line:   "✓ Gratuito para começar  ✓ Sem cartão de crédito
               ✓ Cancele quando quiser"
```

### Layout

```
2 colunas (55% texto / 45% visual):

ESQUERDA:
  Badge pill → Display + H1 → Lead → CTA → Trust line

DIREITA:
  Screenshot do dashboard do app (card com cantos arredondados,
  bg: #EEF2FF, sombra: 0 20px 60px rgba(26,71,200,0.12))
```

### Gatilhos mentais ativados

| Gatilho | Onde |
|---|---|
| **Dor** | "Você ainda calcula no Excel?" (implícito) |
| **Especificidade** | "RMI, RMA, retroativos" — advogado entende |
| **Prova social** | "Plataforma construída para advogados" |
| **Gratuidade** | "Grátis, sem cartão, cancele quando quiser" |

---

## Seção 3 — Dores (Interesse)

**Função no funil:** Fazer o advogado sentir a dor atual. Criar insatisfação com o status quo.

### Copy

```
H2:   "O Cálculo Previdenciário ainda toma horas do seu dia?"

Body: "Se você ainda abre planilhas, consulta tabelas e confere
       manualmente cada contribuição, está perdendo tempo que
       poderia estar usando para captar clientes e protocolar ações."

Grid de 3 dores:

1. ⏱️ "Horas perdidas por caso"
   "Um cálculo que deveria levar 15 minutos leva 2 horas.
   Multiplique por 30 casos por mês."

2. ⚠️ "Medo de errar"
   "Uma regra de transição errada, um índice incorreto,
   um período não considerado — cada erro pode custar
   milhares em honorários ou uma ação de indenização."

3. 📉 "Perda de controle"
   "Planilhas espalhadas, prazos perdidos, clientes
   sem retorno. O escritório cresce mas o processo
   continua artesanal."
```

### Layout

```
3 cards lado a lado com ícone + título + descrição.
Background: white.
Cada card com sombra suave e hover sutil.
Sem números inventados — apenas dores reais.
```

---

## Seção 4 — Como Funciona (Solução)

**Função no funil:** Apresentar a solução de forma simples. 3 passos, sem jargão técnico.

### Copy

```
H2:         "Três Passos. Um Caso Completo."
Subtítulo:  "Do upload do CNIS ao parecer final em minutos."

Grid 2×2 (4 cards, sendo o primeiro destacado):

[PASSO 1 — DESTAQUE AZUL]
  "Upload do CNIS"
  "Faça o upload do PDF do portal Meu INSS. A IA extrai
   automaticamente todas as contribuições, períodos e vínculos."

[PASSO 2]
  "Cálculo Automático"
  "Selecione a modalidade ou deixe o sistema sugerir a melhor.
   RMI, RMA, retroativos e comparativo em segundos."

[PASSO 3]
  "Parecer e Gestão"
  "Gere o parecer jurídico com IA, acompanhe no Kanban,
   consulte processos via DataJud sem abrir o PJe."

[PASSO 4 — BÔNUS]
  "Petição Inicial"
  "Gere a petição inicial completa com IA. Do cálculo ao
   protocolo — tudo na mesma plataforma."
```

### Layout

```
Grid 2×2 de cards.
Card 1 (Passo 1): bg azul escuro (#0D2B8A), texto white — destaque.
Cards 2, 3, 4: bg white, sombra suave, hover translateY(-4px).
```

---

## Seção 5 — Funcionalidades (Desejo)

**Função no funil:** Construir o desejo. Mostrar TUDO que o produto faz. Cada funcionalidade = benefício real.

### Copy

```
CONTEXTO:
  "Tudo que o advogado previdenciário precisa em um só lugar."

GRID DE 8 FUNCIONALIDADES (4x2 ou carrossel):

1. 📄 Leitura Automática do CNIS
   "Upload do PDF e extração automática com IA. O sistema lê
   todas as contribuições, períodos, vínculos e indicadores
   de pendência. Sem digitação. Sem erro humano."

2. 🧮 Calculadora com 14 Modalidades
   "Todas as regras de transição da EC 103/2019 e regras
   permanentes. Cálculo de RMI, RMA, coeficiente e fator
   previdenciário. Atualizado automaticamente com a lei."

3. ⚖️ Parecer Jurídico com IA
   "Gere pareceres preliminares com IA usando os dados reais
   do caso. A IA lê o CNIS, os cálculos e suas anotações
   do prontuário para gerar um rascunho técnico."

4. 🔍 Consulta de Processo (DataJud)
   "Informe o número CNJ e receba o andamento do processo
   sem abrir o PJe. Resumo em linguagem clara gerado por IA.
   Compartilhe direto com o cliente pelo WhatsApp."

5. 📊 Comparativo de Modalidades
   "O sistema calcula automaticamente todas as 11 modalidades
   para ambos os gêneros — 22 cenários — e mostra qual delas
   oferece o melhor RMI. Você não precisa testar uma por uma."

6. 📝 Petição Inicial Automática
   "Com um clique, gere a petição inicial completa: dados
   do cliente, fundamentação legal, cálculos e pedidos.
   Copie, edite e protocole."

7. 📋 Prontuário Imutável
   "Registre cada contato, documento, decisão e prazo.
   Histórico versionado — nunca editável. A IA lê suas
   anotações para gerar diagnósticos automáticos do caso."

8. 🏛️ Módulo BPC/LOAS
   "Análise completa de viabilidade: pré-análise com IA,
   análise de laudo médico, relato social interativo por
   domínios CIF, perguntas para perícia e checklist de
   documentação. Exclusivo para casos BPC."
```

### Layout

```
Seção de fundo escuro (blue-dark, #0D2B8A) ou branco.
Se escuro: card grande com padding 48px, texto white.
Grid 2 colunas: 50% texto + 50% ilustração isométrica.
Ou: grid 2×2 com cards, cada um com ícone + título + descrição.
```

---

## Seção 6 — Prova Social (Credibilidade)

**Função no funil:** Construir confiança. Provar que outros advogados usam e confiam.

### Copy

```
H2:   "Confiado por Advogados Previdenciários em Todo o Brasil"

Sub:  "Plataforma escalável para escritórios de todos os tamanhos."

Métricas reais (baseadas no que o sistema já processou):

  [ 14 ]        [ 2h → 10min ]     [ 12 ]
  Modalidades   Tempo médio        Tipos de
  de cálculo    por caso           benefício

Observação: métricas devem refletir dados REAIS do sistema.
Se não houver dados suficientes, usar métricas qualitativas
como "14 modalidades de cálculo" e "12 tipos de benefício".
```

### Layout

```
3 cards lado a lado.
Card central: destaque azul (#1A47C8) com texto white.
Cards laterais: bg white com sombra.

Números grandes (clamp(2rem, 4vw, 3.5rem))
Labels pequenas abaixo.

NOTA: Sem depoimentos inventados. Sem logos de escritórios
sem autorização. Usar badges institucionais (INSS, CNJ, DataJud,
TRF) como selos de referência.
```

---

## Seção 7 — Casos de Uso

**Função no funil:** Mostrar situações reais onde o Previando resolve. Ajudar o advogado a se enxergar no produto.

### Copy

```
H2:   "Para Cada Tipo de Caso, uma Solução"

Caso 1 — Aposentadoria por Idade
  "Cliente com 65 anos, 180 contribuições. O sistema lê o CNIS,
  calcula o salário de benefício, aplica o coeficiente e gera
  o parecer. Tudo em menos de 10 minutos."

Caso 2 — Revisão de Benefício
  "Segurado já aposentado que pode ter direito a uma RMI maior.
  O sistema compara a regra usada na concessão com as demais
  modalidades disponíveis na época e identifica se há direito
  à revisão."

Caso 3 — BPC/LOAS
  "Cliente idoso ou com deficiência, renda familiar per capita
  inferior a 1/4 do salário mínimo. O módulo BPC faz a
  pré-análise de viabilidade, analisa o laudo médico e gera
  o relatório social completo."

Caso 4 — Planejamento Previdenciário
  "Segurado com 55 anos quer saber se vale a pena contribuir
  por mais 5 anos sobre o teto. O simulador projeta o RMI
  futuro e compara com o cenário atual."
```

### Layout

```
Grid 2×2 de cards. Cada card: ícone + título + descrição curta.
Background: white ou gray-50.
Esses são casos REAIS que o sistema atende — sem dados inventados.
```

---

## Seção 8 — Planos (Decisão)

**Função no funil:** Fechar a venda. Preço justo ancorado no custo de oportunidade.

### Copy

```
H2:         "Comece Grátis. Evolua quando quiser."
Subtítulo:  "Sem fidelidade. Cancele a qualquer momento."

FREE:
  Preço:    Grátis
  Para:     "Testar a plataforma"
  Inclui:
    ✓ 3 clientes
    ✓ 5 cálculos/mês
    ✓ 1 parecer IA/mês
    × Marca d'água em PDFs
    × Sem simulador
    × Sem BPC/LOAS
  CTA: "Começar Grátis"

SOLO → DESTAQUE "Mais Popular":
  Preço:    R$ 97/mês
  Para:     "Advogado individual"
  Inclui:
    ✓ 30 clientes
    ✓ Cálculos ilimitados
    ✓ 20 pareceres IA/mês
    ✓ Petição Inicial (5/mês)
    ✓ Simulador de cenários
    ✓ Cálculo de retroativos
    ✓ Consulta DataJud
    ✓ Export PDF sem marca d'água
    ✓ WhatsApp share
    ✓ Diagnóstico IA
    × Portal do Cliente básico
  CTA: "Assinar Solo"

PRO:
  Preço:    R$ 197/mês
  Para:     "Escritório com equipe"
  Inclui:
    ✓ Clientes ilimitados
    ✓ Tudo ilimitado
    ✓ Petição Inicial ilimitada
    ✓ Portal do Cliente com simulador
    ✓ Módulo BPC/LOAS completo
    × Marca d'água
  CTA: "Assinar Pro"

Âncora de valor (embaixo da tabela):
  "Um único caso de revisão de benefício pode gerar
   entre R$ 5.000 e R$ 30.000 em honorários.
   O Previando Solo custa R$ 97/mês — menos de R$ 3,50 por dia."
```

### Layout

```
3 cards lado a lado.
Card central (SOLO): destaque com borda azul, badge "Mais Popular",
levemente maior (scale 1.03).
Card FREE à esquerda, PRO à direita.

Âncora de valor abaixo: texto centralizado, destaque visual.
```

---

## Seção 9 — FAQ (Objeções)

**Função no funil:** Responder dúvidas e eliminar objeções de compra.

### Perguntas

```
P1: "Preciso instalar alguma coisa?"
R1: "Não. O Previando roda direto no navegador, em qualquer
     computador. Sem instalação, sem configuração. Acesse
     de qualquer lugar."

P2: "Os cálculos são confiáveis juridicamente?"
R2: "Sim. Os cálculos seguem as fórmulas oficiais da legislação
     previdenciária, incluindo todas as regras de transição
     da EC 103/2019 e atualizações de teto e salário mínimo.
     O parecer da IA é um rascunho — o advogado sempre revisa."

P3: "Meus dados ficam seguros?"
R3: "CPFs são armazenados com criptografia (hash). PDFs são
     processados e armazenados em cloud segura. Nenhum dado
     é compartilhado com terceiros. Servidor no Brasil."

P4: "Posso cancelar quando quiser?"
R4: "Sim. Sem multa, sem fidelidade. Cancele pelo painel e
     o plano fica ativo até o fim do período pago."

P5: "E se a legislação mudar?"
R5: "O sistema é atualizado automaticamente. Quando há novas
     regras — novo teto, novas modalidades, novas tabelas —
     a atualização entra sem ação da sua parte. Cálculos
       antigos ficam preservados com a lei da época."

P6: "O que é o Portal do Cliente?"
R6: "É um link que você envia para o cliente acompanhar o
     caso. Ele vê os valores calculados, documentos e pode
     simular cenários. Reduz em até 70% as ligações
     perguntando 'e o processo?'"
```

### Layout

```
Accordion centralizado (max-width: 760px).
Pergunta clicável com ícone +/-
Transição de altura suave.
Background white.
```

---

## Seção 10 — CTA Final (Ação)

**Função no funil:** Última chance de conversão. Reforçar a promessa e eliminar risco.

### Copy

```
Display:  "Inteligência Previdenciária"
H1:       "para Advogados"

Body:     "Comece agora e faça seu primeiro cálculo em minutos."

CTA:      "Criar Conta Grátis →"
Sub:      "Sem cartão de crédito · Cancele quando quiser"
URL:      app.previando.com.br/register
```

### Layout

```
Card grande azul escuro (#0D2B8A), border-radius 24px.
2 colunas: texto esquerda + ilustração isométrica direita.
CTA laranja (#F5820A).
Subtexto branco com opacidade 0.5.
```

---

## Seção 11 — Footer

```
Logo + Tagline:
  "Previando — Previdência inteligente para advogados."

Grid 4 colunas:
  1. Marca: Logo, tagline, Instagram (@previando), "Um produto Unificando"
  2. Produto: Funcionalidades, Planos, Blog, Central de Ajuda
  3. Legal: Termos de Uso, Política de Privacidade, LGPD
  4. Contato: contato@previando.com.br, Instagram, app.previando.com.br

Copyright:
  "© 2026 Previando. Todos os direitos reservados.
   Previando é um produto Unificando | unificando.com.br"
```

### Layout

```
Background: blue-dark (#0D2B8A).
Links brancos com opacidade 0.5, hover white.
Separador sutil entre linhas.
```

---

## Estrutura de Arquivos (React/Vite)

```
previando-web/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   └── sections/
│   │       ├── Hero.jsx         → Atenção
│   │       ├── Dores.jsx        → Interesse (PROBLEMA)
│   │       ├── HowItWorks.jsx   → Solução
│   │       ├── Features.jsx     → Desejo
│   │       ├── UseCases.jsx     → Casos de Uso
│   │       ├── ProvaSocial.jsx  → Credibilidade
│   │       ├── Pricing.jsx      → Decisão
│   │       ├── FAQ.jsx          → Objeções
│   │       └── FinalCTA.jsx     → Ação
│   ├── styles/
│   │   ├── global.css
│   │   └── tokens.css
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
└── Dockerfile
```

**Diferença da versão anterior:** Adicionada seção `Dores.jsx` (antes não existia explicitamente) e `UseCases.jsx` (antes embutido em features). A seção de depoimento foi removida — sem depoimento fake.

---

## Estratégia de Tráfego Pago

### Meta Ads (Instagram/Facebook)

```
Público-alvo:
  - Advogados previdenciários (palavras: "direito previdenciário",
    "cálculo previdenciário", "aposentadoria")
  - Idade: 30-55 anos
  - Localização: Brasil
  - Interesses: OAB, INSS, direito previdenciário, escritório de advocacia

Criativos:
  - Headline: "Você ainda calcula aposentadoria no Excel?"
  - Subtítulo: "CNIS → Cálculo → Parecer em minutos. Grátis."
  - CTA: "Testar Grátis →"

Pixel Meta:
  - Evento padrão: "Lead" para registro
  - Evento customizado: "Trial Started" para primeiro login
```

### Google Ads

```
Palavras-chave:
  [Exatas]  "calculadora previdenciária", "calcular aposentadoria advogado"
  [Frase]   "cálculo previdenciário online", "software previdenciário"
  [Ampla]   "calcular RMI", "calcular tempo de contribuição"

Anúncios:
  Título 1: Calculadora Previdenciária com IA
  Título 2: RMI, RMA e Retroativos Automáticos
  Descrição: Faça o upload do CNIS e receba o cálculo completo.
    Grátis para começar. app.previando.com.br
```

---

## Métricas de Sucesso da LP

| Métrica | O que mede | Meta |
|---|---|---|
| **CTR** | Cliques no CTA / Visitantes | > 8% |
| **Taxa de conversão** | Cadastros / Visitantes | > 3% |
| **Tempo na página** | Engajamento com o conteúdo | > 2 min |
| **Taxa de rejeição** | Saída sem interação | < 50% |
| **Custo por lead** | Investimento / Cadastros | < R$ 15 |
| **FREE → SOLO** | Conversão de trial para pago | > 5% |

---

## Gatilhos Mentais Aplicados na LP

| Gatilho | Seção | Como é ativado |
|---|---|---|
| **Dor** | Hero + Dores | "Você ainda calcula no Excel?" |
| **Urgência** | Hero + CTA | "Comece agora. Grátis." |
| **Especificidade** | Funcionalidades | "14 modalidades", "22 cenários" |
| **Prova social** | Métricas | "Utilizado por escritórios em todo o Brasil" |
| **Autoridade** | Parcerias | INSS, CNJ, DataJud, OAB |
| **Reciprocidade** | FREE | "Grátis para começar, sem cartão" |
| **Ancoragem** | Planos | R$ 97/mês vs R$ 5.000-30.000 de honorários |
| **Prova** | Como funciona | 4 passos visuais do fluxo real |

---

## Checklist Pré-Lançamento

- [ ] Seções implementadas na ordem do funil (AIDA)
- [ ] Nenhum dado inventado (depoimento, logo de parceiro)
- [ ] CTAs apontando para app.previando.com.br/register
- [ ] Pixel Meta instalado com evento de conversão
- [ ] Google Tag Manager configurado
- [ ] Session timeout: 30min (não expirar durante leitura)
- [ ] Links do footer funcionando (Termos, Privacidade, LGPD)
- [ ] Mobile testado (iOS + Android)
- [ ] PageSpeed > 90 (mobile e desktop)
- [ ] SSL ativo (Let's Encrypt)
- [ ] og:image 1200×630px gerada
- [ ] @previando no Instagram configurado
- [ ] contato@previando.com.br funcionando
- [ ] UTM parameters nos links dos anúncios
- [ ] Microsoft Clarity (heatmap) instalado
- [ ] Evento de clique no CTA principal trackeado
