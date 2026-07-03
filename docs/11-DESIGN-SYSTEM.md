# 11 — DESIGN SYSTEM
> Diretrizes visuais, tipografia, componentes e regras de UX/UI do Previando
> Última atualização: 2026-07-03

---

## 1. Princípios Visuais (Premium Legal Design)

O Previando adota uma estética **Premium, Acessível e Clean**, focada em transmitir confiança, autoridade e modernidade para advogados previdenciários.

**Pilares:**
- **Autoridade & Confiança:** Cores sóbrias e tipografia clássica (Serifada) combinada com Sans-Serif moderna.
- **Acessibilidade:** Alto contraste para facilitar a leitura diária exaustiva de dados.
- **Minimalismo Focado:** Menos bordas pesadas e mais espaços em branco.
- **Interações Fluidas:** Microinterações suaves (sombras de elevação, transições de hover).

---

## 2. Paleta de Cores

| Nome | Classe Tailwind | Hexadecimal | Uso |
|---|---|---|---|
| **Fundo Principal** | `bg-slate-50` | `#f8fafc` | Background |
| **Fundo Secundário** | `bg-white` | `#ffffff` | Cards, modais |
| **Primária (Escura)** | `text-slate-900` / `bg-slate-900` | `#0f172a` | Títulos, botões |
| **Secundária (Texto UI)** | `text-slate-600` | `#475569` | Textos descritivos |
| **Acento (Destaque)** | `text-amber-600` / `bg-amber-600` | `#d97706` | CTAs, badges |
| **Bordas** | `border-slate-200` | `#e2e8f0` | Divisões sutis |

---

## 3. Tipografia

- **Títulos e Headings:** Fonte Serifada (`font-serif` - Playfair Display)
- **UI e Corpo de Texto:** Fonte Sans-Serif (`font-sans` - Inter)
- **Dados/Código:** Fonte Mono (`font-mono` - JetBrains Mono)
- **Carregamento:** `next/font/google` com `display: 'swap'` (sem layout shift)

---

## 4. Componentes Base

### 4.1 Elevação e Sombras
| Token | Classe | Uso |
|---|---|---|
| `elevation-sm` | `shadow-elevation-sm` | Botões, tags |
| `elevation-md` | `shadow-elevation-md` | Cards |
| `elevation-lg` | `shadow-elevation-lg` | Modais, dropdowns |

### 4.2 Botões
| Variante | Estilo | Uso |
|---|---|---|
| `primary` | `bg-slate-900 text-white` | Ações principais |
| `outline` | `bg-white text-slate-900 border` | Ações secundárias |
| `danger` | `bg-red-600 text-white` | Exclusão |
| `ghost` | `bg-transparent text-slate-600` | Ações discretas |

Tamanhos: `sm` (px-3 py-1.5 text-xs), `md` (px-4 py-2 text-sm), `lg` (px-6 py-3 text-base).

**Uso:** Sempre preferir `<Button>` em vez de estilos inline. O componente gerencia loading, disabled e foco.

### 4.3 Formulários e Inputs
| Classe | Uso |
|---|---|
| `neo-input` | Input padronizado (bg-white, border-slate-300, focus:ring-amber-600) |
| `neo-label` | Label padronizado (font-medium text-sm text-slate-700) |
| `Input.tsx` | Componente React com label, error, hint |

**Uso:** Preferir a classe `neo-input` sobre estilos inline. O `<Input>` componente já usa `neo-input` internamente.

### 4.4 Spinner
Componente `<Spinner size="sm | md | lg" />` — substitui usos manuais de `Loader2` + `animate-spin`.

### 4.5 PageHeader
Componente `<PageHeader icon title description action meta />` — padroniza cabeçalhos de página.

### 4.6 PageError
Componente `<PageError error reset title />` — padroniza estados de erro.

### 4.7 AlertBanner
Componente `<AlertBanner variant="warning | error | success | info" icon title />` — banners de alerta.

### 4.8 EmptyState
Componente `<EmptyState icon title description action />` — estados vazios.

---

## 5. Regras de Acessibilidade (a11y)

1. **Foco Visível:** `:focus-visible` global definido em `globals.css` (outline 2px amber + offset 2px)
2. **Contraste:** Mínimo 4.5:1 para texto pequeno. Placeholder `slate-400` (2.8:1) → usar `slate-500` para texto visível
3. **ARIA Attributes:** Modais, tooltips e tabs com `aria-hidden`, `aria-label`, `role`
4. **Touch Targets:** Mínimo 44x44px em telas móveis
5. **Skip-to-content:** Links de navegação por teclado nos layouts auth e dashboard
6. **Focus trap:** `useFocusTrap` em modais e drawers
7. **Heading hierarchy:** Uma única `<h1>` por página, hierarquia semântica h1→h2→h3

---

## 6. Animações

Definidas em `tailwind.config.ts` e `globals.css`:
- `animate-slide-in`: Drawer slide (0.3s cubic-bezier)
- `animate-fade-in`: Fade in (0.2s ease-out)
- `animate-slide-up`: Toast slide (0.3s ease-out)
- `animate-slide-down`: Banner slide (0.2s ease-out)
- `animate-loading-bar`: Barra de progresso CNIS (2s linear)
- `animate-fab-attention`: Pulso do FAB (1.8s infinite)
- `animate-hint-fade`: Dica do FAB (5s ease-out)
- `prefers-reduced-motion`: Respeitado globalmente (spinners mantidos)
