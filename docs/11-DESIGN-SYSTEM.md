# 11 — DESIGN SYSTEM
> Diretrizes visuais, tipografia, componentes e regras de UX/UI do Previando

---

## 1. Princípios Visuais (Premium Legal Design)

O Previando adota uma estética **Premium, Acessível e Clean**, focada em transmitir confiança, autoridade e modernidade para advogados previdenciários e seus clientes.

**Pilares:**
- **Autoridade & Confiança:** Cores sóbrias e tipografia clássica (Serifada) combinada com Sans-Serif moderna.
- **Acessibilidade:** Alto contraste para facilitar a leitura diária exaustiva de dados e processos.
- **Minimalismo Focado:** Remoção de ruídos visuais. Menos bordas pesadas e mais espaços em branco (white space).
- **Interações Fluidas:** Microinterações suaves (glassmorphism sutil, sombras de elevação e transições de hover).

---

## 2. Paleta de Cores (Design Tokens)

As cores do sistema foram escolhidas para garantir acessibilidade e transmitir o caráter jurídico premium da aplicação.

| Nome | Classe Tailwind | Hexadecimal | Uso |
|---|---|---|---|
| **Fundo Principal** | `bg-slate-50` | `#f8fafc` | Background do sistema (app background) |
| **Fundo Secundário (Superfícies)** | `bg-white` | `#ffffff` | Cards, modais, formulários (elevation) |
| **Primária (Escura)** | `text-slate-900` / `bg-slate-900` | `#0f172a` | Títulos principais, botões de ação primários, topbar/sidebar |
| **Secundária (Texto UI)** | `text-slate-600` | `#475569` | Textos descritivos, dados de apoio e subtítulos |
| **Acento (Destaque Premium)** | `text-amber-600` / `bg-amber-600` | `#d97706` | Call-to-actions estratégicos, badges importantes, links |
| **Bordas** | `border-slate-200` | `#e2e8f0` | Divisões estruturais muito sutis, inputs |

> **Nota de Acessibilidade:** O contraste entre texto (`slate-900` ou `slate-600`) e os fundos (`slate-50` ou `white`) atende às diretrizes WCAG AA e AAA.

---

## 3. Tipografia

- **Títulos e Headings (Display):** Fonte Serifada elegante (`font-serif` - ex: *Playfair Display*, *Merriweather*). Transmite respeito e formalidade.
- **UI e Corpo de Texto (Interface):** Fonte Sans-Serif moderna e legível (`font-sans` - ex: *Inter*). Focada na legibilidade de dados densos (processos, valores).

*Remover o uso excessivo de caixa alta (`uppercase tracking-widest`) que dificultam a leitura contínua de blocos longos.*

---

## 4. Estruturas e Componentes Base

### 4.1 Elevação e Sombras (Shadows)
Os componentes flutuam suavemente ao invés de usar sombras sólidas brutalistas:
- `shadow-sm`: Para pequenos elementos interativos (botões menores).
- `shadow-md` (Elevation 1): Para Cards de dados e Painéis secundários.
- `shadow-lg` (Elevation 2): Para Modais, Popovers e Dropdowns.

### 4.2 Bordas (Border Radius)
Componentes possuem curvas amigáveis e modernas:
- `rounded-md`: Botões, inputs, tags pequenas.
- `rounded-lg` / `rounded-xl`: Cards maiores, modais, painéis estruturais.

### 4.3 Formulários e Inputs
- **Fundo:** Branco (`bg-white`)
- **Borda Padrão:** Fina e sutil (`border border-slate-300`)
- **Foco (Active):** Anel de foco claro para acessibilidade (`focus:ring-2 focus:ring-amber-600 focus:border-transparent`).

### 4.4 Botões
- **Primário:** `bg-slate-900 text-white hover:bg-slate-800 rounded-md px-4 py-2 font-medium transition-colors`
- **Secundário (Acento):** `bg-amber-600 text-white hover:bg-amber-700 rounded-md px-4 py-2 font-medium transition-colors`
- **Terciário (Outline):** `border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-md px-4 py-2 font-medium transition-colors`

---

## 5. Regras de Acessibilidade (a11y)

1. **Foco Visível:** Nunca remova o estado de `:focus-visible` nativo. Customizá-lo para a cor de acento se necessário, mas garantir operabilidade total por teclado.
2. **Contraste:** Utilizar textos em `slate-900` sobre branco/off-white. Evitar tons claros para texto (ex: `text-slate-400` deve ser evitado em elementos cruciais).
3. **ARIA Attributes:** Em modais, tooltips e guias (tabs), garantir uso de `aria-hidden`, `aria-label` e `role` adequados.
4. **Espaçamento e Área de Toque (Touch Targets):** No mínimo `44x44px` para elementos clicáveis em telas móveis.

---

## 6. Feedback Visual e Microinterações

- **Hover States:** Todo elemento interativo deve ter um estado de hover explícito (mudança de cor de fundo, elevação sutil).
- **Loading:** Evitar bloqueios rudes. Utilizar skeleton screens ou spinners elegantes (animação suave) junto ao contexto onde a ação está ocorrendo.
- **Empty States:** Quando não houver dados, exibir ilustrações abstratas ou ícones em linha fina (Thin Icons), texto explicativo (`slate-600`) e sempre um botão de chamada principal para resolver o estado vazio.
