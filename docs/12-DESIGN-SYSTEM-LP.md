# 12 — DESIGN SYSTEM — Landing Page (previando.com.br)
> Extraído da referência visual Syntra — adaptado para o Previando
> Este design system é exclusivo da LP (previando.com.br)
> O app (app.previando.com.br) usa o Neo-Brutalismo da Unificando (ver 11-DESIGN-SYSTEM.md)

---

## Filosofia Visual

Estilo **Professional SaaS** — corporativo, limpo, confiável.
Transmite credibilidade jurídica sem ser pesado.
Contraste entre seções claras e seções escuras (azul royal).
Isometria como linguagem visual principal — ilustrações 3D flat.

**Diferença do Design System do App:**
- App (Neo-Brutalismo): preto + neon, sem bordas arredondadas, tipografia pesada
- LP (Professional SaaS): azul + laranja, bordas arredondadas, tipografia clean

---

## 1. Paleta de Cores

### Cores Primárias

| Token | Valor Hex | Uso |
|---|---|---|
| `blue-primary` | `#1A47C8` | CTAs principais, fundos de seção destaque, links |
| `blue-dark` | `#0D2B8A` | Header dark, footer, seção final hero |
| `blue-light` | `#EEF2FF` | Fundos de seção clara, cards secundários |
| `orange-accent` | `#F5820A` | Destaques numéricos, badges ativos, ícones de feature |
| `orange-light` | `#FFF3E0` | Background de badge laranja claro |

### Cores Neutras

| Token | Valor Hex | Uso |
|---|---|---|
| `white` | `#FFFFFF` | Fundo principal, texto sobre escuro |
| `gray-50` | `#F8F9FC` | Fundo de seções alternadas |
| `gray-100` | `#F1F3F9` | Cards, inputs |
| `gray-400` | `#94A3B8` | Texto muted, labels secundários |
| `gray-600` | `#475569` | Corpo de texto |
| `gray-900` | `#0F172A` | Títulos principais sobre fundo claro |

### Uso por Contexto

```
Fundo hero principal:     white (#FFFFFF)
Fundo hero título:        white com tipografia gray-900
Seção de prova social:    white
Seção de métricas:        gray-50 (#F8F9FC)
Card de métrica destaque: blue-primary (#1A47C8) com texto white
Seção dark (features):    blue-dark (#0D2B8A) com texto white
Seção clara alternada:    white
Seção de depoimento:      white
Footer / CTA final:       blue-dark (#0D2B8A)
```

---

## 2. Tipografia

**Família:** `Inter`, sans-serif (Google Fonts)

### Escala

| Papel | Tamanho | Peso | Uso |
|---|---|---|---|
| **Display Hero** | `clamp(3rem, 7vw, 6rem)` | 900 (Black) | Palavra/frase de impacto no hero |
| **Heading H1** | `clamp(1.8rem, 3.5vw, 2.75rem)` | 700 (Bold) | Títulos de seção com subtítulo |
| **Heading H2** | `clamp(1.5rem, 2.5vw, 2rem)` | 700 | Subtítulos de cards dark |
| **Heading H3** | `1.125rem` | 600 (SemiBold) | Títulos de cards, features |
| **Body Large** | `1rem` | 400 | Parágrafos principais |
| **Body Small** | `0.875rem` | 400 | Descrições de feature, legendas |
| **Label** | `0.75rem` | 500 | Labels de seção, badges |
| **Micro** | `0.625rem` | 400 | Copyright, disclaimers |
| **Metric** | `clamp(2rem, 4vw, 3.5rem)` | 700-900 | Números de destaque (45%, 100s, 3.5x) |

### Linha e Espaçamento

```css
--leading-tight:   1.1   /* Display hero */
--leading-snug:    1.25  /* Headings */
--leading-normal:  1.5   /* Body */
--leading-relaxed: 1.7   /* Parágrafos longos */

--tracking-tight:  -0.03em  /* Display, grandes títulos */
--tracking-normal:  0        /* Body */
--tracking-wide:    0.05em   /* Labels, micro */
```

---

## 3. Espaçamento e Layout

### Container
```css
max-width: 1200px;
margin: 0 auto;
padding: 0 24px;   /* Mobile */
padding: 0 48px;   /* Tablet */
padding: 0 80px;   /* Desktop */
```

### Seções
```css
/* Seção padrão */
padding: 80px 0;      /* Mobile: 48px */

/* Seção hero */
padding: 60px 0 80px;

/* Seção final (CTA) */
padding: 80px 48px;
border-radius: 24px;
margin: 0 24px 40px;
```

### Grid
```css
/* 2 colunas */
grid-template-columns: 1fr 1fr;
gap: 48px;

/* 3 colunas (métricas, features) */
grid-template-columns: repeat(3, 1fr);
gap: 24px;

/* 4 colunas (logos parceiros) */
grid-template-columns: repeat(4, 1fr);
gap: 32px;
```

---

## 4. Bordas e Raios

```css
/* Cards padrão */
border-radius: 16px;

/* Cards pequenos, badges */
border-radius: 8px;

/* Botões */
border-radius: 8px;

/* Pills / tags */
border-radius: 100px;

/* Seção final CTA */
border-radius: 24px;

/* Nunca usar border-radius: 0 (reservado para o app Neo-Brutalista) */
```

---

## 5. Sombras

```css
/* Card padrão */
box-shadow: 0 4px 24px rgba(26, 71, 200, 0.08);

/* Card hover */
box-shadow: 0 8px 40px rgba(26, 71, 200, 0.15);

/* Card destaque (métrica) */
box-shadow: 0 8px 32px rgba(26, 71, 200, 0.25);

/* Navbar */
box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
```

---

## 6. Componentes

### 6.1 Botões

```css
/* CTA Primário — azul */
.btn-primary {
  background: #1A47C8;
  color: #FFFFFF;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s;
}
.btn-primary:hover {
  background: #1539A8;
  transform: translateY(-1px);
}

/* CTA Laranja — seção escura */
.btn-orange {
  background: #F5820A;
  color: #FFFFFF;
  padding: 14px 28px;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
}
.btn-orange:hover { background: #D97008; }

/* CTA Outline — sobre fundo escuro */
.btn-outline-white {
  background: transparent;
  color: #FFFFFF;
  border: 2px solid rgba(255,255,255,0.4);
  padding: 12px 26px;
  border-radius: 8px;
  font-weight: 600;
}
.btn-outline-white:hover {
  border-color: #FFFFFF;
  background: rgba(255,255,255,0.08);
}
```

### 6.2 Navbar

```
Estrutura:
[Logo] ——————— [Nav Links] ——————— [CTA Button]

Background: white com box-shadow sutil
Position: sticky top-0, z-index: 100
Height: 64px
Logo: ícone + "Previando" em font-weight 700
Links: gray-600, hover blue-primary, font-size 0.875rem
CTA: btn-orange ("Ver Demonstração")
```

### 6.3 Hero Section

```
Layout: duas colunas (texto esquerda, visual direita)
Coluna texto:
  - Badge pill: "Novo — Calculadora Previdenciária com IA"
  - Display title: palavra de impacto grande (ex: "Inteligência")
  - H1: tagline principal
  - Body: descrição
  - CTA button primário
  - Trust line: "✓ Gratuito para começar  ✓ Cancele quando quiser"

Coluna visual:
  - Ilustração isométrica ou screenshot do app
  - Fundo: card arredondado gray-50
  - Sombra suave
```

### 6.4 Prova Social (logos)

```
Título centralizado: "Utilizado por escritórios em todo o Brasil"
Grid de logos: 4 colunas, grayscale opacity 0.6
Hover: opacity 1
Separação: border-top e border-bottom 1px solid gray-100
Padding: 40px 0
```

### 6.5 Cards de Métricas

```
3 cards lado a lado:
- 2 cards brancos com sombra
- 1 card central azul (destaque)

Conteúdo de cada card:
  - Número grande (Metric typography)
  - Label abaixo (Body Small, gray-400)
  - Sublabel menor (Micro)

Card azul central:
  - Background: blue-primary
  - Número: white
  - Labels: rgba(255,255,255,0.75)
```

### 6.6 Feature Card (seção dark)

```
Container: background blue-dark, border-radius 20px, padding 48px
Layout: 50% texto + 50% visual/ilustração

Lista de features:
  - Ícone (16px, circular background rgba(255,255,255,0.1))
  - Título: white, font-weight 600, 1rem
  - Descrição: rgba(255,255,255,0.65), 0.875rem
  - Separador: border-bottom rgba(255,255,255,0.1)

CTA button: btn-orange
```

### 6.7 Cards de Processo (grid 2x2)

```
4 cards em grid 2x2
Card ativo (destaque):
  - Background: blue-primary
  - Texto: white
  - Ícone isométrico à direita
  - border-radius: 16px

Cards normais:
  - Background: white
  - Sombra suave
  - Ícone isométrico
  - Título: gray-900, H3
  - Descrição: gray-600, Body Small
```

### 6.8 Depoimento

```
Layout: 2 colunas (texto esquerda, visual direita)
  - H2 grande no topo esquerdo: "Confiado por Advogados"
  - Subtítulo: gray-400
  - Texto do depoimento: gray-600, Body Large, italic
  - Avatar + nome + cargo
  - Indicadores de slide (dots): gray-200, active: orange-accent
```

### 6.9 CTA Final

```
Container: background blue-dark
  border-radius: 24px
  margin: 0 24px
  padding: 64px 48px
  overflow: hidden

Layout: 2 colunas
  Esquerda: H1 grande white + CTA button orange
  Direita: ilustração isométrica

Subtexto embaixo do botão: rgba(255,255,255,0.5)
```

### 6.10 Footer

```
Background: blue-dark (mesmo da navbar dark ou um tom mais escuro)
Layout:
  Linha 1: Logo | Links nav | Contato
  Linha 2 (separador): border-top rgba(255,255,255,0.1)
  Linha 3: Copyright | Redes sociais

Links: rgba(255,255,255,0.5), hover white
Ícones sociais: 32px, background rgba(255,255,255,0.1), border-radius 50%
```

---

## 7. Ilustrações Isométricas

O estilo visual central é **isometria flat 3D**. As ilustrações usam:

```
Paleta de ilustrações:
  - Azul principal: #1A47C8 (estruturas, plataformas)
  - Laranja: #F5820A (elementos de destaque, cubos)
  - Cinza claro: #E2E8F0 (plataformas, bases)
  - Branco: #FFFFFF (detalhes)
  - Sombra de cubo: rgba(0,0,0,0.15)

Estilo: flat 3D sem textura
Perspectiva: isométrica 30°
Elementos típicos: cubos empilhados, plataformas, documentos, gráficos
```

**Para o Previando:** substituir os elementos de "data/AI" por elementos jurídicos:
- Documentos empilhados (CNIS, processos)
- Balança da justiça em isometria
- Cadeado (segurança de dados)
- Gráfico de barras (cálculos)
- Calendário (prazos)

**Fonte gratuita de ilustrações isométricas:**
- unDraw (undraw.co) — filtrar por "legal", "documents", "data"
- Storyset (storyset.com) — estilo próximo

---

## 8. Animações e Interações

```css
/* Hover em cards */
transition: transform 0.2s ease, box-shadow 0.2s ease;
:hover { transform: translateY(-4px); }

/* Fade in ao scroll (Intersection Observer) */
.reveal {
  opacity: 0;
  transform: translateY(32px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.reveal.visible { opacity: 1; transform: none; }

/* Número animado (contagem) */
/* Usar CountUp.js ou implementação simples com requestAnimationFrame */

/* Botão CTA */
transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(26,71,200,0.3); }
:active { transform: translateY(0); }
```

---

## 9. Responsividade

| Breakpoint | px | Comportamento |
|---|---|---|
| Mobile | < 640px | Stack vertical, tipografia reduzida, padding 24px |
| Tablet | 640–1024px | Grid 2 colunas onde possível |
| Desktop | > 1024px | Layout completo conforme spec |

```css
/* Display hero responsivo */
font-size: clamp(2.5rem, 6vw, 6rem);

/* Grid de métricas */
@media (max-width: 640px) {
  grid-template-columns: 1fr;
  .metric-card-center { order: -1; } /* Card destaque primeiro no mobile */
}

/* Grid 2x2 features */
@media (max-width: 768px) {
  grid-template-columns: 1fr;
}
```

---

## 10. Tokens CSS (variáveis)

```css
:root {
  /* Cores */
  --color-primary:      #1A47C8;
  --color-primary-dark: #0D2B8A;
  --color-primary-light:#EEF2FF;
  --color-accent:       #F5820A;
  --color-accent-light: #FFF3E0;
  --color-white:        #FFFFFF;
  --color-gray-50:      #F8F9FC;
  --color-gray-100:     #F1F3F9;
  --color-gray-400:     #94A3B8;
  --color-gray-600:     #475569;
  --color-gray-900:     #0F172A;

  /* Tipografia */
  --font-family: 'Inter', sans-serif;
  --font-display: clamp(3rem, 7vw, 6rem);
  --font-h1:     clamp(1.8rem, 3.5vw, 2.75rem);
  --font-h2:     clamp(1.5rem, 2.5vw, 2rem);
  --font-h3:     1.125rem;
  --font-body:   1rem;
  --font-small:  0.875rem;
  --font-label:  0.75rem;
  --font-metric: clamp(2rem, 4vw, 3.5rem);

  /* Espaçamento */
  --section-padding: 80px;
  --container-max:   1200px;
  --container-pad:   clamp(24px, 5vw, 80px);

  /* Bordas */
  --radius-sm:  8px;
  --radius-md:  16px;
  --radius-lg:  24px;
  --radius-pill:100px;

  /* Sombras */
  --shadow-card:  0 4px 24px rgba(26, 71, 200, 0.08);
  --shadow-hover: 0 8px 40px rgba(26, 71, 200, 0.15);
  --shadow-cta:   0 8px 24px rgba(26, 71, 200, 0.30);

  /* Transições */
  --transition-fast:   0.15s ease;
  --transition-normal: 0.2s ease;
  --transition-slow:   0.6s ease;
}
```
