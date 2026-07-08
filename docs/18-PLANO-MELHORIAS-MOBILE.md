# 18 — Plano de Melhorias Mobile (UI/UX/Usabilidade)

> Diagnóstico completo da versão mobile do Previando e plano de ação priorizado.
> Baseado em análise do código em 08/07/2026, seguindo diretrizes de Apple HIG, Material Design e WCAG
> (via skill `ui-ux-pro-max`: touch targets ≥ 44px, mobile-first, sem scroll horizontal, dvh > vh, safe areas).

---

## Sumário executivo

O app funciona bem em desktop, mas em mobile apresenta **4 causas-raiz** que explicam as "telas cortadas" e a má aderência:

| # | Causa-raiz | Efeito percebido |
|---|-----------|------------------|
| 1 | Uso de `h-screen`/`100vh` em layouts e páginas | Conteúdo cortado na parte inferior (barra de endereço do navegador mobile "come" a tela) |
| 2 | `Modal` sem altura máxima nem scroll interno | Modais longos estouram a viewport e o rodapé (botões) fica inacessível |
| 3 | Tabelas com apenas `overflow-x-auto` (sem visão em cards) | Listas de clientes/casos/honorários viram scroll horizontal ruim de usar no celular |
| 4 | Grids e larguras fixas sem prefixo responsivo (`grid-cols-2/3/7`, `min-w-[900px]`, `w-[320px]`) | Elementos espremidos, textos truncados, células ilegíveis (calendário) |

Além disso: inputs com fonte 14px causam **auto-zoom no iOS**, o layout **admin não tem menu mobile**, botões `sm` ficam abaixo do alvo de toque mínimo, e não há tratamento de **safe-area** (notch/gesture bar), apesar do app se declarar PWA-capable.

---

## Fase 1 — Correções críticas (telas cortadas) 🔴

### 1.1 Trocar `h-screen`/`100vh` por unidades dinâmicas (`dvh`)

**Problema:** `100vh` em navegadores mobile inclui a área atrás da barra de endereço. Quando a barra está visível, o final da página fica cortado — é a principal causa do sintoma relatado.

**Onde ocorre:**
- `src/app/(dashboard)/layout.tsx:16` — `flex h-screen` (afeta TODAS as telas do dashboard)
- `src/components/Sidebar.tsx:123` — `h-screen`
- `src/app/admin/layout.tsx:14` — `h-screen sticky`
- `src/app/(dashboard)/clients/kanban/page.tsx:272,287` — `h-[calc(100vh-4rem)]`
- `src/app/(dashboard)/calendar/page.tsx:454` — `h-[calc(100vh-250px)]`
- `src/app/(dashboard)/dashboard/page.tsx:77` e `reports/page.tsx:94` — `h-[calc(100vh-4rem)]`
- `src/app/(dashboard)/cases/[id]/cnis/page.tsx:174` — `min-h-[calc(100vh-12rem)]`

**Como fazer:**
1. Adicionar suporte no Tailwind (v3 já tem `dvh` a partir da 3.4; o projeto usa `^3`, verificar versão):
   ```tsx
   // (dashboard)/layout.tsx
   <div className="flex h-dvh bg-slate-50 ...">
   ```
2. Substituir todos os `h-[calc(100vh-Xrem)]` por `h-[calc(100dvh-Xrem)]` (ou `min-h-0 flex-1` quando o pai já é flex).
3. Regra geral: `100vh` → `100dvh`; para conteúdo que precisa apenas "ocupar o resto", preferir `flex-1 min-h-0` em vez de calcular altura.

### 1.2 `Modal` com altura máxima e scroll interno

**Problema:** `src/components/ui/Modal.tsx:38-59` centraliza o dialog mas não limita a altura nem cria scroll interno. Modais com formulários longos (ex.: `EditPeriodModal`, criação de cliente) ficam com o rodapé cortado fora da tela — sem como tocar nos botões.

**Como fazer:**
```tsx
// Modal.tsx
<div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
  <div className={cn(
    'bg-white ... w-full flex flex-col',
    'max-h-[100dvh] sm:max-h-[85dvh]',           // nunca estoura a viewport
    'rounded-t-2xl sm:rounded-lg',               // bottom-sheet no mobile
    sizes[size], className
  )}>
    <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 ...">...</div>
    <div className="p-4 sm:p-6 overflow-y-auto">{children}</div>  {/* scroll interno */}
  </div>
</div>
```
Extras no mesmo arquivo:
- Adicionar `useBodyScrollLock(open)` (hook já existe e é usado no `Drawer`) — hoje a página de fundo continua rolando atrás do modal.
- Botão fechar com `min-w-[44px] min-h-[44px]` (hoje é `p-1.5` ≈ 32px).
- Padrão **bottom-sheet** no mobile (`items-end` + `rounded-t-2xl`) é o idiomático em iOS/Android e melhora alcance do polegar.

### 1.3 Layout Admin sem navegação mobile

**Problema:** `src/app/admin/layout.tsx:14` tem sidebar fixa de `w-64` sempre visível, sem hamburger/drawer. Em um celular de 375px, sobram ~119px para o conteúdo — admin fica inutilizável no celular.

**Como fazer:** replicar o padrão já existente no dashboard (`Sidebar.tsx` + `useSidebarStore`):
- Esconder a sidebar por padrão em `< lg` (`fixed inset-y-0 -translate-x-full` + overlay).
- Adicionar botão hamburger no header do admin.
- Alternativa mais rápida: extrair o `Sidebar` do dashboard para aceitar `sections` como prop e reutilizar nos dois layouts.

### 1.4 Safe areas (notch / gesture bar)

**Problema:** o app declara `appleWebApp.capable: true` (`src/app/layout.tsx:30`), mas nenhum lugar do código usa `env(safe-area-inset-*)`. Instalado como PWA (standalone), header e conteúdo inferior ficam atrás do notch/barra de gestos.

**Como fazer:**
1. Em `globals.css`:
   ```css
   body { padding: env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left); }
   ```
   ou aplicar pontualmente: header com `pt-[env(safe-area-inset-top)]`, drawers/bottom-sheets com `pb-[env(safe-area-inset-bottom)]`.
2. Garantir `viewport-fit=cover` exportando `viewport` no `layout.tsx`:
   ```tsx
   export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#d97706' }
   ```

---

## Fase 2 — Usabilidade de toque e formulários 🟠

### 2.1 Inputs com fonte 16px (elimina auto-zoom do iOS)

**Problema:** `.neo-input` usa `text-sm` (14px) em `src/app/globals.css:41`. No iOS Safari, focar um input com fonte < 16px dispara zoom automático da página — desalinha o layout e é uma das maiores causas de "não se encaixou bem".

**Como fazer:**
```css
.neo-input {
  @apply w-full px-3 py-2.5 font-sans text-base sm:text-sm rounded-md ...;
}
```
(16px no mobile, volta a 14px no desktop). Aplicar o mesmo no input de busca do `Header.tsx:128` (`text-sm` → `text-base sm:text-sm`) e em `Select`, `DatePicker`, `CurrencyInput`, `MonthPicker`.

### 2.2 Alvos de toque ≥ 44px

**Problema:** vários controles abaixo do mínimo (Apple HIG 44pt / Material 48dp):
- `src/components/ui/Button.tsx:19` — `sm: px-3 py-1.5 text-xs` ≈ 30px de altura
- Botão "Hoje" do calendário (`calendar/page.tsx:344`) — `py-2 text-xs`
- Botão fechar do `Modal.tsx:53` — `p-1.5`
- Links "Ver caso →" nas notificações (`Header.tsx:189`) — `text-xs` inline

**Como fazer:**
- No `Button.tsx`, garantir altura mínima por tamanho: `sm: 'px-3 py-2 text-xs min-h-[40px] sm:min-h-0 sm:py-1.5'` (ou simplesmente `min-h-[44px]` no mobile via `max-sm:min-h-[44px]`).
- Auditar botões icon-only: sempre `min-w-[44px] min-h-[44px]` (padrão já usado no Sidebar/Header — replicar).
- Adicionar em `globals.css`: `button, a { touch-action: manipulation; }` para remover atraso de toque e evitar double-tap-zoom acidental.

### 2.3 Teclados corretos nos campos

**Como fazer:** revisar formulários (cliente, caso, cálculo, GPS, honorários) garantindo `type`/`inputMode` semânticos:
- CPF, NIT, valores, salários: `inputMode="numeric"` ou `"decimal"`
- E-mail: `type="email"`; telefone: `type="tel"`
- Adicionar `autocomplete` (name, email, tel, cep, address) — o `AddressFields.tsx` é o candidato principal.

### 2.4 Grids de formulário 2 colunas no mobile

**Problema:** `grid grid-cols-2` sem prefixo responsivo espreme pares de campos em ~160px cada:
- `src/components/client/ClientFormPage.tsx:244`
- `src/app/(dashboard)/cases/[id]/cnis/_components/modals/EditPeriodModal.tsx:36` e `EditSalariesModal.tsx:29`
- `src/app/(dashboard)/cases/[id]/honorarios/page.tsx:535`
- `src/app/portal/[token]/page.tsx:106`, `PortalContent.tsx:170`, `components/portal/PortalSimulator.tsx:101`

**Como fazer:** trocar por `grid grid-cols-1 sm:grid-cols-2` (campos um abaixo do outro no celular). Exceção: pares curtos tipo "Data início / Data fim" podem permanecer em 2 colunas se cada campo couber com ≥ 140px.

---

## Fase 3 — Listas e tabelas (padrão cards no mobile) 🟠

**Problema:** as telas mais usadas são tabelas largas com `overflow-x-auto`. Scroll horizontal de tabela em celular é péssimo para escanear/agir:
- `src/app/(dashboard)/clients/list/page.tsx:221` (Clientes)
- `src/app/(dashboard)/cases/page.tsx:322` (Casos)
- `src/app/(dashboard)/honorarios/page.tsx:176`
- `src/app/(dashboard)/activity/page.tsx:167`
- `src/app/admin/regras-aposentadoria/page.tsx:241` (`min-w-[900px]`)
- `src/components/admin/AdminTable.tsx`

**Como fazer (padrão dual-view):**
1. Manter a `<table>` com `hidden md:table` (desktop intacto).
2. Adicionar lista de cards `md:hidden`, um card por registro, com:
   - Linha 1: nome do cliente/caso (negrito) + badge de status
   - Linha 2: 2-3 metadados essenciais (benefício, prazo, valor)
   - Ação primária como card inteiro clicável (navega ao detalhe); ações secundárias no `ActionsDropdown` existente
3. Criar um componente genérico `ResponsiveTable`/`MobileCardList` em `components/ui/` para não duplicar código nas 6 telas.
4. Conteúdo prioritário primeiro: no mobile mostrar só o essencial; detalhes ficam na tela de detalhe.

**Ordem sugerida:** Clientes → Casos → Honorários → Activity → Admin (menor uso mobile).

---

## Fase 4 — Telas específicas 🟡

### 4.1 Calendário (`calendar/page.tsx`)

**Problema:** grade mensal `grid-cols-7` com células `min-h-[120px]` (linhas 358-441). Em 375px cada célula tem ~50px de largura — títulos de eventos ilegíveis, altura total enorme (6 semanas × 120px ≈ 2 telas); a timeline lateral usa `h-[calc(100vh-250px)]` e fica fora da dobra.

**Proposta mobile (`< md`) — visão agenda como padrão:**
1. **Toggle Mês / Lista** no topo; no mobile o padrão é **Lista (agenda)**: eventos do mês em lista vertical agrupada por dia ("Ter, 8 jul — 2 eventos"), com dias vazios omitidos. É o formato que responde à pergunta real do usuário ("o que vem aí?") sem caçar dots numa grade apertada.
2. **Grade mensal compacta** (quando o usuário escolher Mês): células `min-h-[52px]` mostrando só o número do dia + até 3 dots coloridos (sem títulos; títulos só em `md:`). A grade inteira cabe numa tela.
3. **Tocar num dia → bottom-sheet** com os eventos do dia (reuso do padrão do menu do caso, com as correções do A.1) — em vez da coluna lateral, que no mobile fica fora da dobra.
4. **Swipe horizontal** para trocar de mês (além das setas), e cabeçalho do mês **sticky** com botão "Hoje" com alvo de 44px (hoje é `py-2 text-xs`).
5. **Filtros como chips roláveis** (Prazos · Prescrição · Audiências...) em vez de dropdown — uma linha horizontal com `overflow-x-auto`, contagem em cada chip.
6. Corrigir `100vh` → `100dvh` (Fase 1) e adicionar legenda de cores dos tipos de evento (hoje a cor é o único indicador — viola `color-not-only`).

### 4.2 Kanban (`clients/kanban/page.tsx`) — estratégia mobile completa (print 08/07)

**Problema:** colunas fixas `w-[320px]` (linha 341) com scroll horizontal sem snap nem indicador de posição; drag-and-drop (`@dnd-kit`) compete com o scroll do dedo; empty state diz "Arraste casos para cá" — instrução de mouse que não faz sentido no toque.

**Decisão de UX:** manter o paradigma de colunas com swipe horizontal (o print mostra que o "peek" da próxima coluna já aparece — bom), mas **mover cards via menu, não via drag**, que é o padrão confiável em touch.

**Como fazer (em ordem):**
1. **Snap + largura fluida:** colunas `w-[85vw] max-w-[320px] snap-center` e contêiner com `snap-x snap-mandatory overflow-x-auto overscroll-x-contain`.
2. **Navegação por chips:** acima do quadro, uma linha de chips roláveis com nome + contagem de cada etapa (`Prospecção 0 · Análise 2 · ...`); tocar num chip faz `scrollIntoView` da coluna e o chip ativo acompanha o scroll (IntersectionObserver). Resolve o "onde estou / quantas etapas existem".
3. **Mover sem arrastar:** em cada card, menu "⋯" com "Mover para → [lista de etapas]" e atalhos "← etapa anterior / próxima etapa →". No `@dnd-kit`, manter drag como secundário com `TouchSensor` + `activationConstraint: { delay: 250, tolerance: 8 }` (long-press inicia o drag, scroll normal não).
4. **Empty state por dispositivo:** "Arraste casos para cá" só em `lg:`; no mobile, "Nenhum caso nesta etapa".
5. **Altura:** após a correção de `dvh` (Fase 1), coluna com `max-h` do espaço disponível e scroll vertical interno próprio (`overscroll-contain`) para não brigar com o swipe horizontal.
6. Cards com alvo de toque generoso e feedback `active:` (Fase 5.2).

### 4.3 Header (`components/Header.tsx`) — confirmado em print (08/07)

**Problemas:** em 375px convivem hamburger + busca + sino + divisor + nome/cargo/avatar. A busca vira uma "pílula" minúscula e inutilizável (parece decorativa), o nome/cargo (`linhas 210-215`) consome ~30% da largura, e o dropdown de notificações `w-80` posicionado por `absolute` pode vazar da tela.

**Layout proposto para `< sm` (4 elementos, respiro entre eles):**

```
┌────────────────────────────────────┐
│ ☰        [logo opcional]   🔍 🔔 (R)│
└────────────────────────────────────┘
```

**Como fazer:**
- Esconder nome/cargo (`hidden sm:flex` no bloco de texto) e o divisor `h-8 w-px` (`hidden sm:block`) — o avatar sozinho já é o botão de perfil.
- **Busca vira ícone no mobile**: `< sm` esconde o input e mostra um botão-lupa `min-w-[44px] min-h-[44px]`; ao tocar, abre busca em tela cheia (overlay `fixed inset-0` com input em foco automático, fonte 16px, botão "Cancelar") — padrão iOS/Android. Em `≥ sm`, mantém o input atual com `min-w-0`.
- Notificações: `w-80 max-w-[calc(100vw-2rem)]`; no mobile preferir `fixed inset-x-4 top-16` (folha em largura quase total).
- Remover `Notification.requestPermission()` no mount (linha 51) — pedir permissão sem gesto do usuário é bloqueado pelos navegadores e é anti-padrão; pedir após uma ação (ex.: ativar lembretes de prazo).
- Garantir `gap-2` mínimo entre os botões de ícone (alvos de 44px já existem — bom).

### 4.4 Detalhe do caso (`cases/[id]/_components/CaseLayoutClient.tsx`)

Já tem bom padrão mobile (bottom-sheet de navegação). Ajustes:
- `px-6 md:px-8` (linha 176) → `px-4 sm:px-6 md:px-8` para ganhar respiro em 375px.
- Bottom-sheet: adicionar `pb-[env(safe-area-inset-bottom)]` e `max-h-[85dvh]`.

### 4.5 Páginas com `p-8` fixo

`compare/page.tsx:104`, `clients/list/[id]/page.tsx:43`, entre outras — padronizar para `p-4 sm:p-6 lg:p-8` (padrão já usado no dashboard). Criar convenção documentada no `11-DESIGN-SYSTEM.md`.

### 4.6 Tipografia mínima

Muitos `text-[9px]`/`text-[10px]` como texto informativo (ex.: `activity/page.tsx:183`, badges do calendário, labels do case layout). Abaixo de 12px é ilegível em celular:
- Texto que o usuário precisa **ler**: mínimo `text-xs` (12px).
- `text-[9px]/text-[10px]` só para micro-labels decorativos em caps — e mesmo assim revisar contraste (`text-slate-400` sobre branco = 2.8:1, abaixo do WCAG; usar `text-slate-500`+).

---

## Fase 5 — Polimento e prevenção 🟢

### 5.1 Navegação inferior (bottom nav) — melhoria de UX opcional

O acesso ao menu no mobile exige abrir o drawer. Um **bottom tab bar** com os 4-5 destinos principais (Dashboard, Clientes, Casos, Calendário, Mais) segue o padrão iOS/Android e reduz toques:
- Componente `MobileBottomNav` renderizado só em `< lg`, `fixed bottom-0` com `pb-[env(safe-area-inset-bottom)]`.
- `main` ganha `pb-16 lg:pb-0` para o conteúdo não ficar atrás da barra.
- Item "Mais" abre o drawer atual com o restante das seções.

### 5.2 Feedback de toque

- Adicionar estado pressed nos elementos interativos: `active:bg-slate-100` / `active:scale-[0.98]` em cards clicáveis e botões (hoje quase tudo é só `hover:`, que não existe em touch).
- `-webkit-tap-highlight-color: transparent` no CSS global (junto com os estados `active:` próprios).

### 5.3 Gráficos do dashboard

Revisar `DashboardCharts.tsx`/`reports` em 375px: ticks de eixo abreviados (`jan`, `fev`), menos gridlines, legendas embaixo, tooltips acionáveis por toque. Skeleton do KPI grid no `dashboard/page.tsx:14` usa `grid-cols-4` fixo — alinhar com o grid real (`grid-cols-2 lg:grid-cols-4`).

### 5.4 Processo: checklist mobile para novas telas

Adicionar ao `docs/11-DESIGN-SYSTEM.md` um checklist de PR:
- [ ] Testado a 375px (e 320px se possível) sem scroll horizontal
- [ ] Sem `100vh` (usar `dvh` ou `flex-1 min-h-0`)
- [ ] Grids com prefixos responsivos (`grid-cols-1 sm:grid-cols-2 ...`)
- [ ] Alvos de toque ≥ 44px; inputs com fonte ≥ 16px no mobile
- [ ] Tabelas com visão em card no mobile (usar `ResponsiveTable`)
- [ ] Modais/sheets com `max-h-[85dvh]` + scroll interno + safe-area
- [ ] Padding de página `p-4 sm:p-6 lg:p-8`

---

## Anexo A — Diagnóstico dos prints em dispositivo real (08/07/2026)

Testes manuais do usuário confirmaram e refinaram o diagnóstico. Observação importante de leitura dos prints: **elementos `position: fixed` aparecem repetidos em screenshots de página inteira** (o menu "Seções do Caso" triplicado e o botão flutuante laranja repetido ao longo do CNIS são artefatos da captura). Os bugs reais por trás deles, porém, existem e estão listados abaixo.

### A.1 Menu "Seções do Caso" (bottom-sheet) — confuso e "incompleto" 🔴

**Arquivo:** `src/app/(dashboard)/cases/[id]/_components/CaseLayoutClient.tsx:261-335`

**Problemas reais:**
1. **Sem trava de scroll do body** (`useBodyScrollLock` não é usado aqui, só no `Drawer`). Ao rolar dentro do menu, o scroll "vaza" para a página de fundo (scroll chaining) — o usuário rola, o menu parece não responder e dá a impressão de que "não carregou o menu todo".
2. Sem focus trap (o `Drawer` tem, este sheet caseiro não).
3. `max-h-[85vh]` (vh, não dvh) + sem `pb-[env(safe-area-inset-bottom)]` — última seção fica atrás da barra de gestos.
4. Com 13-14 itens de `p-3` + headers de categoria, o menu SEMPRE excede a altura e exige scroll interno, sem nenhuma pista visual de que há mais conteúdo abaixo.

**Como fazer:**
- Adicionar `useBodyScrollLock(showMobileMenu)` e `useFocusTrap` (hooks já existem).
- No contêiner do sheet: `max-h-[85dvh] overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]`.
- Compactar itens: `p-2.5` e listar em `grid grid-cols-2 gap-1.5` (os labels são curtos — 2 colunas cabem bem e o menu inteiro passa a caber numa tela).
- Adicionar "grabber" (barrinha cinza no topo) e gradiente de fade no rodapé enquanto houver conteúdo rolável.
- Melhor ainda: reutilizar o componente `Drawer`/criar `BottomSheet` genérico em `components/ui/` para padronizar (mesmo problema existirá em outros sheets).

### A.2 Botões flutuantes (FAB) cobrindo conteúdo e bloqueando cliques (mobile E desktop) 🔴

**Arquivo:** `src/components/case/CaseFloatingActions.tsx:132` (`fixed bottom-6 right-6 z-40`) — e o equivalente verde na tela de cliente.

**Problema 1 — zona morta de cliques (afeta também o desktop):** o contêiner externo do FAB mantém a lista de sub-botões **sempre montada no DOM**. Fechada, ela fica com `opacity-0 pointer-events-none`, mas continua ocupando layout (~150×350px acima do botão). Como os filhos têm `pointer-events-none`, o hit-test do navegador "atravessa" os sub-botões e atinge o **contêiner pai** (`CaseFloatingActions.tsx:132`), que tem pointer-events padrão — ou seja, existe uma área invisível acima/ao lado do FAB que engole cliques em qualquer viewport. É por isso que itens atrás/ao lado dele não são clicáveis nem no desktop.

**Como corrigir a zona morta:**
```tsx
// contêiner externo: deixa de capturar cliques
<div ref={menuRef} className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 pointer-events-none">
  {/* sub-lista: só recebe cliques quando aberta */}
  <div className={cn('... transition-all', isOpen ? 'opacity-100 ... pointer-events-auto' : 'opacity-0 ... pointer-events-none')}>...</div>
  {/* hint e botão principal: reativam cliques individualmente */}
  {showHint && <div className="pointer-events-auto ...">...</div>}
  <button className="pointer-events-auto ...">...</button>
</div>
```
Alternativa equivalente: só renderizar a sub-lista quando `isOpen` (perde a animação de saída) ou usar `invisible` (visibility) em vez de apenas `opacity-0`. Aplicar a mesma correção no FAB da tela de cliente.

**Problema 2 — sobreposição de conteúdo no mobile:** o FAB cobre valores e ações (visível nos prints do CNIS e do cliente); sem offset de safe-area; o rodapé da página (ex.: botão "Excluir Extrato CNIS") fica parcialmente encoberto.

**Como fazer:**
- Nas páginas que têm FAB, dar respiro ao conteúdo: `pb-24` (ou `pb-[calc(6rem+env(safe-area-inset-bottom))]`) no contêiner principal.
- FAB com `bottom-[calc(1.5rem+env(safe-area-inset-bottom))]`.
- Considerar padrão "hide on scroll down, show on scroll up" no mobile, ou converter o FAB em barra de ações inferior fixa (mais idiomático e não cobre conteúdo).

### A.3 Análise CNIS — página quilométrica e toolbar quebrada 🟠

**Arquivos:** `cnis/_components/CnisExtractedData.tsx` e `PeriodItem.tsx`

**Problemas confirmados nos prints:**
1. Com vínculos expandidos (botão "Expandir"), as 102 contribuições viram uma parede de pares competência/valor (`grid grid-cols-2` no mobile) — rolagem interminável, fácil se perder.
2. Toolbar (Exportar CSV / Expandir / Recolher / + Adicionar) quebra em 2-3 linhas no mobile.
3. Breadcrumb "VOLTAR PARA RENATO BEZERRA GOMES DA SILVA JUNIOR" em caps quebra em 2 linhas (`CaseLayoutClient.tsx:146`).
4. Cabeçalho consome ~2 telas antes do conteúdo útil: breadcrumb + título do caso + badges + seletor de seção + card-título "Extrato do CNIS" + ações + card "Histórico de Vínculos".

**Como fazer:**
- **Limitar salários por vínculo expandido**: mostrar as 6 primeiras competências + botão "Ver todas as N contribuições" que abre o detalhe completo (modal fullscreen no mobile / o que já existe de edição). Alternativa: dentro do vínculo, agrupar por ano em accordions.
- No mobile, desabilitar "Expandir todos" ou trocar por navegação vínculo-a-vínculo; manter vínculos **recolhidos por padrão** (já é o default — bom).
- Toolbar mobile: ação primária visível (+ Adicionar) e o resto num menu "⋯" (`ActionsDropdown` já existe).
- Breadcrumb: `Voltar para <span className="truncate max-w-[180px]">{nome}</span>` ou só "Voltar" no mobile.
- Compactar o header do caso no mobile: título + badges numa linha, breadcrumb curto, e reduzir `py-6/py-8` para `py-3/py-4` em `< md`.
- Barra de resumo **sticky** no topo durante a rolagem do extrato (empregador atual visível), para dar contexto na lista longa.

### A.4 Dashboard — KPIs empilhados desperdiçam 2 telas 🟠

**Arquivo:** `src/components/dashboard/DashboardKpiGrid.tsx:47` (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`)

**Problema:** no celular cada KPI vira um cartão alto (`p-6`, ícone 48px em cima, número, label) — 4 cartões ocupam ~2 telas antes de qualquer conteúdo útil.

**Como fazer:**
- `grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4` com variante compacta no mobile: layout horizontal (ícone `w-9 h-9` à esquerda, número `text-2xl` + label à direita), `p-4`.
- Mesmo padrão para os 3 cards de stats da tela de cliente (Total de Casos / Em Andamento / Finalizados) e para o donut "Clientes por Prioridade" (reduzir altura no mobile).

### A.5 Visão Geral do caso — cards Anotações/Cálculos/Checklist parecem quebrados 🟠

**Arquivo:** `src/app/(dashboard)/cases/[id]/_components/ActivitySummary.tsx:17` (`grid-cols-1 sm:grid-cols-3`)

**Problema:** no mobile cada card vira uma faixa larga e quase vazia (label minúsculo + número à esquerda, ícone solto à direita) — parece conteúdo que não carregou.

**Como fazer:** manter `grid-cols-3` sempre (`grid grid-cols-3 gap-2 sm:gap-4`), com card compacto vertical no mobile: ícone em cima, número, label. E deixar claro que são **clicáveis** (abrem os drawers correspondentes): adicionar chevron/estado `active:` — hoje não têm affordance de ação.

### A.6 Lista de Clientes — tabela desencaixada em larguras intermediárias 🟠

**Print em ~850px:** colunas sobrepostas, nome quebrando palavra por palavra numa coluna estreita, "rasgo" visual entre o container e a tabela.

**Causas prováveis:** tabela sem larguras mínimas por coluna (`table-auto` espreme "Cliente" enquanto `overflow-x-auto` deixa o resto vazar) + célula de nome sem `min-w`/`whitespace` controlados (`clients/list/page.tsx:254-260`).

**Como fazer:**
- Curto prazo: `min-w-[640px]` na tabela + `whitespace-nowrap` em datas/contato + `min-w-[200px]` na coluna Cliente.
- Definitivo: padrão dual-view da **Fase 3** (cards abaixo de `md`), que elimina a tabela no mobile.

### A.6b Lista de Casos ("Todos os Casos") — tabela estourando o container 🟠

**Arquivo:** `src/app/(dashboard)/cases/page.tsx:322` (print 08/07)

**Problemas confirmados:** os mesmos da lista de Clientes (A.6), com evidência extra: a tabela **vaza para fora do card** com "rasgos" visuais entre grupos de colunas em larguras pequenas, a coluna Cliente quebra o nome palavra por palavra, e as 8 colunas (Cliente, Benefício, Status, Prioridade, RMI, Prazo, Criado em, Ações) nunca caberão numa tela estreita.

**Como fazer:**
- Mesmo tratamento da Fase 3 / A.6: **cards no mobile** (`md:hidden`), tabela só em `md:+`. Card sugerido: nome do cliente + badge de status na 1ª linha; benefício + prazo na 2ª; toque abre o caso, "⋯" para ações.
- Curto prazo na tabela: `min-w-[760px]` na `<table>`, `min-w-[180px]` na coluna Cliente, `whitespace-nowrap` nas datas, e garantir que o card pai tenha `overflow-hidden` + o wrapper `overflow-x-auto` (é o vazamento do print).
- O botão "Filtros Avançados" já recolhe os filtros — ótimo; ao criar o `FilterSheet` (A.7), migrar para o mesmo componente para manter consistência.
- Priorizar colunas por valor: no tablet (`md`), esconder "RMI Calculada" e "Criado em" (`hidden lg:table-cell`) — sobra espaço para o nome respirar.

### A.7 Honorários — tabela cortada e filtros que ocupam meia tela 🟠

**Arquivo:** `src/app/(dashboard)/honorarios/page.tsx` (print 08/07)

**Problemas confirmados:**
1. Tabela cortada na borda direita ("TOTA...", "R$ 6.000,0") — o `overflow-x-auto` existe mas não há affordance de que dá para rolar, e a coluna Cliente espreme o nome palavra por palavra.
2. Bloco de filtros (Buscar / Status / De / Até) ocupa meia tela antes do conteúdo; os campos de data em par desalinhado.
3. KPIs (Total Esperado / Recebido / Pendente / Taxa) empilhados 1 por linha — mesmo problema do dashboard (A.4).

**Como fazer:**
- **KPIs:** `grid grid-cols-2 gap-3` no mobile (4 cards em 2×2, cabem numa dobra).
- **Filtros recolhíveis (padrão para todo o app):** no mobile, manter só a busca visível + botão "Filtros" com badge de quantos estão ativos (`Filtros · 2`); tocar abre bottom-sheet com Status, De, Até e botão "Aplicar"/"Limpar". Bônus: presets de período (Este mês · Últimos 30 dias · Este ano) em chips — mais rápido que digitar duas datas.
- **Tabela:** aplicar o padrão dual-view da Fase 3 (cards no mobile: cliente + caso na 1ª linha, valor total + status pago/pendente na 2ª). Valores monetários com `whitespace-nowrap` e fonte tabular (`font-mono` já usado no app).
- Este padrão de filtros deve ser extraído para `components/ui/FilterSheet.tsx` e reutilizado em Casos, Clientes, Prazos e Atividade.

### A.8 Log de Atividades — ruim no desktop, pior no mobile 🟠

**Arquivo:** `src/app/(dashboard)/activity/page.tsx` (print 08/07)

**Problemas confirmados:**
1. No mobile, a coluna do badge tem `min-w-[140px]` (linha 183), roubando espaço do detalhamento — que quebra palavra por palavra; a data fica cortada ("08/0…").
2. No desktop o problema é o mesmo em menor grau: 3 colunas com larguras desbalanceadas e texto repetitivo ("CNIS enviado para Renato Bezerra Gomes da Silva Junior" em toda linha).

**Como fazer — trocar tabela por feed/timeline (mobile E desktop):**
Log de auditoria é conteúdo cronológico, não tabular. Substituir a `<table>` por uma lista vertical:
```
● [CNIS ENVIADO]  há 2 horas
  Renato Bezerra Gomes da Silva Junior
  extrato.pdf · 80.2 KB
```
- Cada item: badge compacto + timestamp relativo ("há 2h", com data completa em `title`) na primeira linha; nome do cliente (link para o caso) na segunda; metadados em texto menor na terceira.
- Agrupar por dia com headers sticky ("Hoje", "Ontem", "05 de julho").
- Badge sem `min-w` fixo (`min-w-[140px]` → remover; largura natural do conteúdo).
- No desktop, a mesma lista com largura máxima `max-w-3xl` — auditoria lê melhor em coluna única do que em tabela larga.
- Paginação "Carregar mais" ou infinite scroll (lista de auditoria cresce indefinidamente).

### A.9 Dicionário CNIS — página de ~29.000px com tudo expandido 🟠

**Arquivo:** `src/app/(dashboard)/tools/cnis-indicators/page.tsx` (print 08/07)

**Problemas confirmados:** todos os indicadores são renderizados como cards totalmente expandidos (sigla + badge + grupo + descrição + box de alerta), em coluna única no mobile — a página passa de 28.000px de altura. O box de alerta ("Indicador informativo. Enquadramento específico...") é **texto boilerplate repetido em quase todos os cards**, inflando a página sem agregar informação. A busca e os chips de filtro existem (linhas 56-77 — boa base), mas ficam no topo: a 10.000px de profundidade não há como filtrar sem voltar tudo.

**Como fazer:**
1. **Accordion recolhido por padrão:** cada item mostra só `sigla + badge de tipo + grupo` (~56px); tocar expande descrição e detalhes. A página inteira cai para ~10% da altura e vira escaneável.
2. **Remover o alerta repetido:** a explicação genérica de cada tipo (Informativo/Pendência/Acerto) aparece **uma vez** como legenda no topo (ou tooltip no badge), não em cada card. Só alertas realmente específicos do indicador permanecem no item expandido.
3. **Busca e chips sticky:** `sticky top-0 z-10 bg-slate-50` na barra de busca/filtros — filtrar de qualquer ponto da lista.
4. **Agrupar por `grupo`** (Vínculos e Remunerações, etc.) com headers de seção — o dado já existe (linha 22).
5. **Performance:** com centenas de cards, virtualizar a lista (ou paginação "Carregar mais" após ~50) — no mobile esse DOM gigante trava o scroll.
6. Aplicar as mesmas correções no `CnisIndicatorsDrawer.tsx`, que já usa accordion (`expandedKeys`) — aproveitar esse padrão como referência.

---

## Ordem de execução recomendada

| Sprint | Itens | Esforço | Impacto |
|--------|-------|---------|---------|
| 1 | 1.1 dvh, 1.2 Modal, 2.1 inputs 16px, **A.1 menu do caso, A.2 FAB** | Baixo (1-2 dias) | **Resolve "telas cortadas", menu confuso e auto-zoom** |
| 2 | **A.4 KPIs, A.5 ActivitySummary**, 2.2 touch targets, 2.4 grids de form, 4.3 Header, 4.5 paddings | Baixo/médio | Encaixe visual geral |
| 3 | Fase 3 (cards nas tabelas: Clientes e Casos primeiro) + **A.6, A.7 (filtros + honorários), A.8 (feed de atividades)** | Médio (3-5 dias) | Maior ganho de usabilidade diária |
| 4 | **A.3 CNIS, A.9 Dicionário CNIS**, 4.1 Calendário, 4.2 Kanban, 1.3 Admin, 1.4 safe-areas | Médio | Telas específicas |
| 5 | Fase 5 (bottom nav, feedback de toque, gráficos, checklist) | Médio | Polimento e prevenção |

**Como validar:** testar manualmente em 375×667 (iPhone SE), 390×844 (iPhone 14) e 360×800 (Android comum), nas orientações retrato e paisagem, com a barra de endereço visível — é nela que o bug de `100vh` aparece.
