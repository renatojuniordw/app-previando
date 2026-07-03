# Handoff — Sprint de Melhorias UI/UX

## Resumo

Sprint focada em correções de bugs, acessibilidade, novos componentes base, feedback visual, e preparação para adoção de design system. Todo o código está em working tree (não commitado). **Build passando sem erros.**

---

## Status final — todas as fases concluídas

### 🐛 Fase 0 — Correções de Bugs (7/7) ✅

| Item | Arquivos | Descrição |
|------|----------|-----------|
| Login password relative | `src/app/(auth)/login/page.tsx` | Adicionado `position: relative` ao container do password |
| Login error alert | `src/app/(auth)/login/page.tsx` | Adicionado `role="alert"` na mensagem de erro |
| Modal foco | `src/components/ui/Modal.tsx`, `Drawer.tsx`, `UpgradeModal.tsx` | Adicionado `tabIndex={-1}` em todos |
| Scroll lock | `src/hooks/useBodyScrollLock.ts` | Adicionado `'use client'` + compensação de scrollbar width |
| Case tabs locked | `src/app/(dashboard)/cases/[id]/layout.tsx` | `href="#"` substituído por `e.preventDefault()` |
| Reduced-motion | `src/app/globals.css` | `@media (prefers-reduced-motion)` exclui spinners da redução |
| PDF build errors | `src/components/pdf/*.tsx` (4) | Removido `alt` prop do `Image` (`@react-pdf/renderer` não suporta) |

### 🎯 Fase 1 — Kanban (7/7) ✅

| Item | Descrição |
|------|-----------|
| KeyboardSensor | Registrado no `DndContext` + `accessibility` prop para navegação por teclado |
| CaseCard memo | Wrapped em `React.memo` para evitar re-renders desnecessários |
| Stale closure fix | `handleDragEnd` usa `casesRef.current` em vez de closure direta |
| Toast feedback | Sucesso/erro em `persistMove` |
| Scrollbar | Classe `custom-scrollbar` → `neo-scroll` |
| Confirmação FINALIZADO | `ConfirmDialog` antes de mover para status terminal |
| Acessibilidade colunas | `role="list"` + `role="status"` |

### 🧩 Fase 2 — Novos Componentes (5/5) ✅

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| **Tooltip** | `src/components/ui/Tooltip.tsx` | CSS-only, `role="tooltip"`, `aria-describedby`, 4 posições |
| **Popover** | `src/components/ui/Popover.tsx` | Controlado/não-controlado, click-outside, Escape |
| **EmptyState** | `src/components/ui/EmptyState.tsx` | Ícone + título + description + action slot |
| **ConfirmDialog** | `src/components/ui/ConfirmDialog.tsx` | Focus trap, `role="dialog"`, `aria-modal`, 3 variantes |
| **HelpText** | `src/components/ui/HelpText.tsx` | Colapsável, variante default (amber) e info (blue) |

### 💬 Fase 3 — Feedback Visual ✅

| Item | Arquivo | Descrição |
|------|---------|-----------|
| Button | `src/components/ui/Button.tsx` | `type="button"` default + `aria-busy` quando `loading` |
| Toast store | `src/store/toast.ts` | `clearTimeout` no dismiss manual, cleanup no `clearToasts` |
| Confirm honorarios | `src/app/(dashboard)/cases/[id]/honorarios/page.tsx` | `window.confirm()` → `ConfirmDialog` |
| Confirm calculator | `src/app/(dashboard)/cases/[id]/calculator/page.tsx` | `window.confirm()` → `ConfirmDialog` |
| Confirm billing | `src/app/(dashboard)/settings/billing/page.tsx` | `window.confirm()` → `ConfirmDialog` |
| Confirm admin (3) | `src/app/admin/*/page.tsx` (3) | `window.confirm()` → `ConfirmDialog` |
| Confirm CNIS | `src/app/(dashboard)/cases/[id]/cnis/_components/CnisExtractedData.tsx` | `window.confirm()` → `ConfirmDialog` |
| Honorarios catch | `src/app/(dashboard)/cases/[id]/honorarios/page.tsx` | Silent catch → toast de erro |
| Profile saving | `src/app/(dashboard)/settings/profile/page.tsx` | Split `saving` → `savingProfile` + `savingPassword` |

### ♿ Fase 4 — Acessibilidade ✅

| Item | Arquivo | Descrição |
|------|---------|-----------|
| Toast close btn | `src/components/ToastContainer.tsx` | `focus-visible` ring + `p-1.5` padding |
| Tab panel | `src/app/(dashboard)/cases/[id]/layout.tsx` | `role="tabpanel"` + `aria-labelledby` |
| Touch targets 44px | Sidebar, Header, Dashboard, Login, Drawer, QuickActions | `min-h-[44px]`/`min-w-[44px]` em todos elementos interativos |
| focus-visible rings | Sidebar (links + close + sair), Header (hamburger + search + notificações + perfil), Drawer close | `focus-visible:ring-2 focus-visible:ring-amber-500/50` |
| Skip-to-content | `src/app/(auth)/layout.tsx` | Link "Pular para conteúdo principal" → `#auth-content` |

### 📖 Fase 6 — HelpText ✅

| Página | Descrição |
|--------|-----------|
| Calculator | `HelpText` explicando uso da calculadora previdenciária |
| Revisão | `HelpText` sobre tipos de revisão de benefícios |
| BPC/LOAS | `HelpText` sobre análise técnica e documental |
| GPS/DAS | `HelpText` sobre cálculo de contribuições |

### 🔧 Build fixes

| Item | Descrição |
|------|-----------|
| `sucrase` | Downgraded 3.35.1 → 3.34.0 |
| `google-auth-library` | Reinstalado |
| `BpcFormSection.tsx` | Type mismatch `Record<string, unknown>` vs `BpcSavePayload` — exportado tipo + corrigido |
| `*PDFDocument.tsx` (4) | `alt` prop removida (incompatível com `@react-pdf/renderer`) |
| ESLint warnings | `Popover.tsx` (unused `useId`), `Tooltip.tsx` (unused `useRef`), `cases/page.tsx` (missing `addToast` dep) — corrigidos |

---

## Estado do build

```bash
npm run build    ✅ Compila sem erros
npx tsc --noEmit ✅ Passa (apenas erros preexistentes)
npm run lint     ✅ (4 warnings jsx-a11y/alt-text em PDF — aceitável porque @react-pdf/renderer não suporta alt)
```

---

## O que ainda pode ser feito (fora do escopo original)

- Mini-glossário Popover no header do case
- Adoção de Tooltip (86+ `title=` → `<Tooltip>`)
- Adoção de Popover (modalidades, revisão, GPS)
- Performance: `transition-all` específicas, `useCallback`, singleton Intl
- Design System: skeleton loading, dark mode, brand tokens

---

## Arquivos alterados (41 total: 36 modificados + 5 novos)

### Modificados
- `package.json`, `package-lock.json`
- `src/app/(auth)/layout.tsx`, `src/app/(auth)/login/page.tsx`
- `src/app/(dashboard)/cases/[id]/bpc/page.tsx`, `calculator/page.tsx`, `gps/page.tsx`, `honorarios/page.tsx`, `layout.tsx`, `revisao/page.tsx`
- `src/app/(dashboard)/cases/[id]/cnis/_components/CnisExtractedData.tsx`
- `src/app/(dashboard)/cases/page.tsx`
- `src/app/(dashboard)/clients/kanban/page.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/settings/billing/page.tsx`, `profile/page.tsx`
- `src/app/admin/modalidades/page.tsx`, `regras-aposentadoria/page.tsx`, `salario-minimo/page.tsx`
- `src/app/globals.css`
- `src/components/Header.tsx`, `Sidebar.tsx`, `ToastContainer.tsx`, `UpgradeModal.tsx`
- `src/components/bpc/BpcForm.tsx`, `BpcFormSection.tsx`
- `src/components/dashboard/DashboardQuickActions.tsx`
- `src/components/pdf/BpcConsolidatedPDFDocument.tsx`, `BpcPDFDocument.tsx`, `CasePDFDocument.tsx`, `ComparePDFDocument.tsx`
- `src/components/ui/Button.tsx`, `Drawer.tsx`, `Modal.tsx`
- `src/hooks/useBodyScrollLock.ts`
- `src/store/toast.ts`

### Novos
- `src/components/ui/ConfirmDialog.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/HelpText.tsx`
- `src/components/ui/Popover.tsx`
- `src/components/ui/Tooltip.tsx`

### Extra (não commitado)
- `docs/HANDOFF-SPRINT-UI.md`

---

## Decisões arquiteturais

- **Kanban stale closure**: `casesRef.current` dentro do `handleDragEnd` — única forma confiável de evitar closure desatualizada
- **ConfirmDialog FINALIZADO**: status terminal que cancela monitoramento TrackJud — requer confirmação explícita
- **Split saving state**: Profile page tem dois formulários independentes (dados + senha) que não devem compartilhar estado de loading
- **sucrase@3.34.0**: pinned porque 3.35.1 quebrou o `CJSImportProcessor` usado pelo Next.js
- **Tooltip CSS-only**: sem dependências, `role="tooltip"` + `aria-describedby` para a11y
- **HelpText colapsável**: útil para páginas complexas onde help é opcional sem ocupar espaço sempre
- **Touch targets**: `min-h-[44px]`/`min-w-[44px]` adicionado sem alterar paddings existentes para não quebrar layouts
- **focus-visible rings**: padronizado como `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50` em todos elementos
