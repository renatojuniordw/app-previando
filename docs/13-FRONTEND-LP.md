# 13 — FRONTEND — Landing Page
> previando.com.br — Estrutura, Conteúdo e Layout adaptado para advogados
> Stack: React (Vite) + Tailwind CSS — repo: previando-web — porta 60001
> Design System: ver 12-DESIGN-SYSTEM-LP.md

---

## Estrutura de Arquivos

```
previando-web/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   └── sections/
│   │       ├── Hero.jsx
│   │       ├── TrustBar.jsx
│   │       ├── Performance.jsx
│   │       ├── Features.jsx
│   │       ├── HowItWorks.jsx
│   │       ├── Testimonial.jsx
│   │       └── FinalCTA.jsx
│   ├── styles/
│   │   ├── global.css
│   │   └── tokens.css        ← CSS variables do design system
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
└── Dockerfile
```

---

## Seção 1 — Navbar

```
ESTRUTURA:
[Logo Previando] — [Sobre] [Funcionalidades] [Planos] [Blog] — [Entrar] [Ver Demonstração →]

COMPORTAMENTO:
- sticky top-0, z-50
- background: white, box-shadow sutil ao scrollar
- Logo: ícone de balança estilizada + "Previando" bold
- Links: gray-600, hover blue-primary, font-size 14px
- "Entrar": link simples → app.previando.com.br/login
- "Ver Demonstração": btn-orange → app.previando.com.br/register

MOBILE:
- Hamburger menu
- Drawer lateral branco
- CTA no final do drawer
```

**Conteúdo:**
```
Links nav: Sobre | Funcionalidades | Planos | Blog
CTA secundário: Entrar
CTA principal: Ver Demonstração →
URL CTA: https://app.previando.com.br/register
```

---

## Seção 2 — Hero

```
LAYOUT: 2 colunas (55% texto / 45% visual)
BACKGROUND: white
PADDING: 60px 0 80px

COLUNA ESQUERDA:
  1. Badge pill
  2. Display title (palavra grande)
  3. H1 tagline
  4. Parágrafo body
  5. CTA principal
  6. Trust items (linha com ícones)

COLUNA DIREITA:
  - Card arredondado (bg: #EEF2FF, border-radius: 20px)
  - Screenshot do dashboard do app OU ilustração isométrica
  - Sombra suave: 0 20px 60px rgba(26,71,200,0.12)
```

**Conteúdo:**
```
Badge pill:     "Novo — Calculadora com IA para Previdenciário"
Display title:  "Inteligência"
H1:             "Previdenciária para Advogados"
Body:           "A única plataforma construída especificamente para
                 advogados previdenciários. Calcule RMI, RMA e retroativos
                 automaticamente, gerencie casos com IA e acompanhe
                 processos sem abrir o PJe."

CTA texto:      "Começar Gratuitamente"
CTA URL:        https://app.previando.com.br/register

Trust items:
  ✓ Gratuito para começar
  ✓ Sem cartão de crédito
  ✓ Cancele quando quiser
```

---

## Seção 3 — TrustBar (Prova Social)

```
LAYOUT: centralizado, logos em linha
BACKGROUND: white
BORDER: border-top e border-bottom 1px solid #F1F3F9
PADDING: 40px 0

TÍTULO centralizado acima dos logos
LOGOS: 6–8 itens (grayscale 0.4, hover grayscale 0 + opacity 1)
```

**Conteúdo:**
```
Título: "Utilizado por escritórios previdenciários em todo o Brasil"

Logos / selos (texto com ícone, sem logos reais no início):
  - OAB  (ícone balança)
  - INSS (ícone documento)
  - TRF  (ícone tribunal)
  - JEF  (ícone processo)
  - PJe  (ícone sistema)
  - CNJ  (ícone escudo)

Nota: substituir por logos reais de escritórios parceiros quando disponível
Alternativa MVP: usar badges de tecnologia usada
  (Next.js, PostgreSQL, OpenAI, Mercado Pago, Cloudflare)
```

---

## Seção 4 — Performance (Métricas)

```
LAYOUT:
  Topo: H2 esquerda + parágrafo direita (2 colunas)
  Meio: visual/ilustração (card gray-50, largura total)
  Baixo: 3 cards de métrica lado a lado

BACKGROUND: #F8F9FC (gray-50)
PADDING: 80px 0

CARD DE MÉTRICA CENTRAL: background blue-primary (destaque)
CARDS LATERAIS: background white, box-shadow
```

**Conteúdo:**
```
H2:         "Resultados que Transformam o Escritório"
Parágrafo:  "Advogados que usam o Previando relatam redução
             significativa no tempo de análise, mais casos
             atendidos e menos erros de cálculo."

Métrica 1 (card branco esquerdo):
  Número:   "2h → 10min"
  Label:    "Tempo por caso"
  Sub:      "Do CNIS ao parecer"

Métrica 2 (card azul central — destaque):
  Número:   "14"
  Label:    "Modalidades de cálculo"
  Sub:      "Sempre atualizadas com a legislação"

Métrica 3 (card branco direito):
  Número:   "100%"
  Label:    "Bloqueios no servidor"
  Sub:      "Dados protegidos e seguros"

Visual central (card):
  Screenshot do Kanban ou ilustração de dashboard isométrico
```

---

## Seção 5 — Features (Seção Escura)

```
LAYOUT: card arredondado azul escuro
  50% esquerda: texto + lista de features
  50% direita: ilustração isométrica ou screenshot

BACKGROUND DO CARD: #0D2B8A
BORDER-RADIUS: 20px
MARGIN: 0 auto, max-width 1100px
PADDING: 64px 56px

LISTA DE FEATURES:
  Cada item: ícone circular + título + descrição
  Separador entre itens: border rgba(255,255,255,0.1)
```

**Conteúdo:**
```
H2:         "Tudo que o advogado previdenciário precisa"
Parágrafo:  "Desenvolvido com a participação de advogados especialistas.
             Cada funcionalidade resolve uma dor real do dia a dia."

Feature 1:
  Ícone:  📄
  Título: "Leitura Automática do CNIS"
  Desc:   "Upload do PDF e extração automática de todas as
           contribuições, períodos e vínculos. Sem digitação manual."

Feature 2:
  Ícone:  🧮
  Título: "Calculadora com 14 Modalidades"
  Desc:   "Regras de transição da EC 103/2019 e regras permanentes.
           Sistema atualiza automaticamente com mudanças na legislação."

Feature 3:
  Ícone:  ⚖️
  Título: "Consulta de Processo sem PJe"
  Desc:   "Informe o número CNJ e receba um resumo do andamento
           via Datajud com IA. Envie direto ao cliente pelo WhatsApp."

CTA:    "Começar Gratuitamente"
URL:    https://app.previando.com.br/register
```

---

## Seção 6 — HowItWorks (Grid 2×2)

```
LAYOUT:
  Título + subtítulo centralizados
  Grid 2×2 de cards

BACKGROUND: white
PADDING: 80px 0

CARD ATIVO (posição [0,0] — primeiro):
  background: blue-primary
  texto: white
  ícone isométrico: laranja + azul

CARDS NORMAIS:
  background: white
  box-shadow: var(--shadow-card)
  hover: translateY(-4px), shadow maior
```

**Conteúdo:**
```
Título:     "Fluxo Simples, Resultado Profissional"
Subtítulo:  "Do cadastro do cliente ao parecer final em minutos,
             não em horas."

Card 1 (AZUL — destaque):
  Título:   "Upload do CNIS"
  Desc:     "Faça o upload do PDF do CNIS do portal Meu INSS.
             O sistema extrai todos os dados automaticamente."
  Ícone:    ilustração isométrica de documento/upload

Card 2:
  Título:   "Cálculo Automático"
  Desc:     "Selecione a modalidade ou deixe o sistema
             pré-selecionar a vigente. RMI, RMA e retroativos
             calculados em segundos."
  Ícone:    ilustração de calculadora/gráfico

Card 3:
  Título:   "Prontuário do Caso"
  Desc:     "Registre cada contato, documento e decisão.
             Histórico imutável. A IA usa suas anotações para
             gerar diagnósticos automáticos."
  Ícone:    ilustração de caderno/histórico

Card 4:
  Título:   "Gestão no Kanban"
  Desc:     "Acompanhe todos os casos em 5 etapas com alertas
             de prazo automáticos e badges de prioridade."
  Ícone:    ilustração de painel/colunas
```

---

## Seção 7 — Testimonial (Depoimento)

```
LAYOUT: 2 colunas (texto esquerda / visual direita)
BACKGROUND: white
PADDING: 80px 0

ESQUERDA:
  - Label: "CONFIADO POR ADVOGADOS"
  - H2 grande
  - Parágrafo do depoimento (italic)
  - Avatar + nome + cargo
  - Indicadores de slide (dots)

DIREITA:
  - Ilustração isométrica OU screenshot do app
  - Card com sombra arredondado

NOTA: Sem depoimentos inventados no MVP.
Usar placeholder até ter depoimento real.
```

**Conteúdo:**
```
Label:  "CONFIADO POR ADVOGADOS PREVIDENCIÁRIOS"
H2:     "Confiado por Advogados em Todo o Brasil"
Sub:    "Plataforma escalável para previdenciário"

Placeholder depoimento:
  "O Previando transformou a forma como gerencio meus casos.
   O que antes levava horas de planilha agora levo minutos —
   e com muito mais segurança nos cálculos."

Nome:   [Nome do advogado — adicionar quando disponível]
Cargo:  Advogado Previdenciário

IMPORTANTE: Substituir assim que tiver depoimento real.
Não publicar com depoimento inventado.
```

---

## Seção 8 — Planos (Pricing)

```
LAYOUT:
  Título + subtítulo centralizados
  3 cards de plano lado a lado
  Card central: destaque (mais alto, borda azul)
  Âncora de valor abaixo

BACKGROUND: #F8F9FC
PADDING: 80px 0

CARD DESTAQUE (SOLO):
  border: 2px solid blue-primary
  box-shadow: var(--shadow-cta)
  Badge "Mais Popular" acima
  Levemente maior (scale 1.03 ou padding extra)
```

**Conteúdo:**
```
Título:     "Comece Grátis. Evolua quando quiser."
Subtítulo:  "Sem fidelidade. Cancele a qualquer momento."

PLANO FREE:
  Preço:    Grátis
  Período:  para sempre
  Features:
    ✓ 3 clientes
    ✓ 5 cálculos por mês
    ✓ 1 parecer por mês
    ✓ CRM Kanban
    ✓ Checklist de elegibilidade
    ✗ Simulador de cenários
    ✗ Retroativos
    ✗ Consulta de processo (Datajud)
    ✗ Export PDF
    ✗ WhatsApp share
  CTA: "Começar Grátis"
  URL: app.previando.com.br/register

PLANO SOLO (destaque):
  Badge:    "Mais Popular"
  Preço:    R$ 299
  Período:  /mês
  Features:
    ✓ 30 clientes
    ✓ Cálculos ilimitados
    ✓ 20 pareceres por mês
    ✓ Tudo do plano Free
    ✓ Simulador de cenários
    ✓ Cálculo de retroativos
    ✓ Consulta de processo (Datajud)
    ✓ Export PDF sem marca d'água
    ✓ WhatsApp share
    ✓ Diagnóstico IA com prontuário
  CTA: "Assinar Solo"
  URL: app.previando.com.br/register?plan=solo

PLANO PRO:
  Preço:    R$ 599
  Período:  /mês
  Features:
    ✓ Clientes ilimitados
    ✓ Tudo ilimitado
    ✓ Tudo do plano Solo
    ✓ Suporte via chat
    ✓ Atualizações prioritárias
  CTA: "Assinar Pro"
  URL: app.previando.com.br/register?plan=pro

Âncora de valor:
  "Um único caso de revisão de benefício pode valer
   R$ 5.000 a R$ 30.000 em honorários.
   O Previando Solo custa R$ 299/mês."
```

---

## Seção 9 — FAQ

```
LAYOUT: accordion — pergunta + ícone de expand
BACKGROUND: white
PADDING: 80px 0
MAX-WIDTH: 760px centralizado

Cada item:
  - Pergunta: H3, gray-900, cursor pointer
  - Ícone: + / - (rotate 45deg)
  - Resposta: body, gray-600, max-height 0 → auto com transition
  - Separador: border-bottom gray-100
```

**Conteúdo:**
```
Título: "Perguntas Frequentes"

P1: "Preciso instalar alguma coisa?"
R1: "Não. O Previando roda diretamente no navegador, em qualquer
     computador. Sem instalação, sem configuração."

P2: "Os cálculos são juridicamente confiáveis?"
R2: "Os cálculos seguem as fórmulas oficiais da legislação
     previdenciária vigente, incluindo todas as regras de transição
     da EC 103/2019. O parecer gerado pela IA é um rascunho —
     o advogado sempre revisa e assina."

P3: "Os dados dos meus clientes ficam seguros?"
R3: "CPFs são armazenados apenas com criptografia (hash). PDFs são
     descartados após processamento. Nenhum dado é compartilhado com
     terceiros. Hospedagem em servidor nacional."

P4: "Posso cancelar quando quiser?"
R4: "Sim. Sem multa, sem fidelidade mínima. Cancele pelo painel e o
     plano permanece ativo até o fim do período pago."

P5: "O sistema acompanha mudanças na legislação?"
R5: "Sim. Quando há atualização nas regras — novo teto, tabelas IBGE,
     novas modalidades — o sistema é atualizado automaticamente.
     Seus cálculos antigos ficam preservados com a lei da época."

P6: "O que é a Consulta de Processo?"
R6: "Com o número CNJ do processo, o Previando consulta o andamento
     no Datajud (API pública do CNJ) e gera um resumo em linguagem
     clara com IA. Você copia ou envia direto para o cliente pelo
     WhatsApp — sem precisar abrir o PJe."
```

---

## Seção 10 — CTA Final

```
LAYOUT: card arredondado escuro
  BACKGROUND interno: #0D2B8A (blue-dark)
  BORDER-RADIUS: 24px
  MARGIN: 0 24px 80px
  PADDING: 80px 64px
  OVERFLOW: hidden

  2 colunas:
  Esquerda: H1 branco grande + CTA laranja + subtexto
  Direita: ilustração isométrica jurídica

EFEITO: gradiente sutil no background (azul escuro → azul médio)
```

**Conteúdo:**
```
H1:         "Inteligência Previdenciária"
H1 linha 2: "para Advogados"
Sub:        "Comece agora e faça seu primeiro cálculo hoje."

CTA:        "Criar Conta Grátis"
URL:        https://app.previando.com.br/register

Sub CTA:    "Sem cartão de crédito · Cancele quando quiser"

Ilustração: documentos jurídicos + balança em isometria
            (mesmo estilo das outras ilustrações)
```

---

## Seção 11 — Footer

```
BACKGROUND: #0D2B8A (mesmo do header dark / CTA final)
PADDING: 48px 0 24px

LINHA 1 — Grid 4 colunas:
  Col 1: Logo + tagline + redes sociais
  Col 2: Produto (links internos)
  Col 3: Legal
  Col 4: Contato

LINHA 2 — Separador: border-top rgba(255,255,255,0.1)

LINHA 3 — Copyright + links legais
```

**Conteúdo:**
```
Col 1 — Marca:
  Logo: Previando
  Tagline: "Previdência inteligente para advogados."
  Redes: Instagram (@previando)
  Crédito: "Um produto Unificando"
  Link: unificando.com.br

Col 2 — Produto:
  Funcionalidades
  Planos e Preços
  Blog
  Central de Ajuda

Col 3 — Legal:
  Termos de Uso
  Política de Privacidade
  LGPD

Col 4 — Contato:
  contato@previando.com.br
  Instagram: @previando
  app.previando.com.br

Copyright:
  "© 2025 Previando. Todos os direitos reservados.
   Previando é um produto Unificando | unificando.com.br"
```

---

## Ordem das Seções (scroll completo)

```
1.  Navbar (sticky)
2.  Hero (Display + tagline + CTA + visual)
3.  TrustBar (logos / selos de integração)
4.  Performance (H2 + visual + 3 métricas)
5.  Features (card dark com lista)
6.  HowItWorks (grid 2×2 com steps)
7.  Testimonial (depoimento + visual)
8.  Planos (3 cards de pricing)
9.  FAQ (accordion)
10. CTA Final (card azul escuro)
11. Footer
```

---

## Meta Tags (SEO)

```html
<title>Previando — Previdência inteligente para advogados</title>
<meta name="description"
  content="Calcule RMI, RMA e retroativos automaticamente.
  Leitura de CNIS com IA, CRM Kanban e consulta de processos
  sem abrir o PJe. Grátis para começar." />

<meta property="og:title" content="Previando — Previdência inteligente para advogados" />
<meta property="og:description" content="A calculadora previdenciária com IA para advogados." />
<meta property="og:url" content="https://previando.com.br" />
<meta property="og:image" content="https://previando.com.br/og-image.png" />
<meta property="og:type" content="website" />

<meta name="twitter:card" content="summary_large_image" />

<link rel="canonical" href="https://previando.com.br" />
```

---

## Checklist Pré-Launch

- [ ] Todas as seções implementadas e responsivas
- [ ] CTAs apontando para app.previando.com.br
- [ ] Depoimento com pessoa real (ou seção removida)
- [ ] Logos de parceiros reais ou removidos
- [ ] Pixel Meta instalado
- [ ] Google Tag Manager configurado
- [ ] Evento de conversão: clique no CTA principal
- [ ] PageSpeed > 90 mobile e desktop
- [ ] SSL ativo (Let's Encrypt)
- [ ] og:image gerada (1200×630px)
- [ ] Termos de Uso e Política de Privacidade publicados
- [ ] @previando no Instagram com link para previando.com.br
- [ ] contato@previando.com.br funcionando
- [ ] Heatmap (Microsoft Clarity) instalado
