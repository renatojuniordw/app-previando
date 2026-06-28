# 11 — DESIGN SYSTEM
> Diretrizes visuais, tipografia, componentes e regras de UX/UI do Previando
> Última atualização: 2026-06-27

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

### 4.3 Formulários e Inputs
- Fundo: Branco (`bg-white`)
- Borda: `border-slate-300`
- Foco: `focus:ring-2 focus:ring-amber-600 focus:border-transparent`

---

## 5. Regras de Acessibilidade (a11y)

1. **Foco Visível:** Nunca remover `:focus-visible` nativo
2. **Contraste:** `slate-900` sobre branco/off-white
3. **ARIA Attributes:** Modais, tooltips e tabs com `aria-hidden`, `aria-label`, `role`
4. **Touch Targets:** Mínimo 44x44px em telas móveis

---

## 6. Animações

Definidas em `tailwind.config.ts`:
- `animate-slide-in`: Drawer slide (0.3s cubic-bezier)
- `animate-fade-in`: Fade in (0.2s ease-out)
- `animate-spin-slow`: Spinner (3s linear)
