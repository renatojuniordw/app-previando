# Auditoria UX/UI/Acessibilidade — previando-app

> **Data:** 2026-06-29
> **Propósito:** Diagnóstico completo de UX, UI, acessibilidade, máscaras de input, componentes de data e integrações.
> **Escopo:** Apenas diagnóstico. Nenhuma alteração de código deve ser aplicada como parte deste documento.
> **Classificação:** CRÍTICO / MODERADO / BAIXO

---

## Sumário Executivo

Esta auditoria cobre 100+ arquivos entre páginas, componentes, serviços e utilitários. Os principais achados:

- **18 campos formatados (CPF, telefone, moeda, processo) sem máscara de input** — risco de dado incorreto, especialmente nos 13 campos monetários.
- **Nenhum modal/drawer implementa foco trapping** — falha crítica de acessibilidade (WCAG 2.1.2).
- **Nenhum skip-to-content link existe** — usuários de teclado precisam tabular toda a sidebar em cada página.
- **Componente Input.tsx não associa `<label>` ao `<input>` via `htmlFor`/`id`** — padrão replicado em todo o app.
- **13 abas na tela de Casos em scroll horizontal único** — sobrecarga cognitiva e navegação confusa em mobile.
- **15 `<input type="date">` nativos espalhados sem componente DatePicker padronizado.**
- **1 integração externa ativa (Mercado Pago) com webhook implementado.

---

## Fase 0 — CRÍTICO: Acessibilidade e Máscaras

### 0.1 Máscaras de Input

#### 0.1.1 Input.tsx — Componente base sem suporte a máscaras

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/components/ui/Input.tsx` | 1-36 | **MODERADO** | O componente `Input` é um wrapper genérico sem variantes de máscara, formatação ou `type="currency"`. Não há suporte nativo a `InputNumber`/`InputMask` porque o PrimeReact não está no stack. |

**Antes:** `<Input {...register('cpf')} placeholder="000.000.000-00" />`
**Depois (sugestão):** `<Input {...register('cpf')} mask="cpf" />` — requer implementação de máscara ou lib externa.

**Esforço:** Médio

---

#### 0.1.2 CPF — Formulário de criação de cliente

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/app/(dashboard)/clients/list/page.tsx` | 387-392 | **MODERADO** | Campo CPF sem máscara. Placeholder `"000.000.000-00"` orienta visualmente mas não formata a digitação. Schema Zod aceita 11-14 caracteres sem validação de dígitos verificadores. |

**Antes:** `<Input {...register('cpf')} placeholder="000.000.000-00" />`
**Depois (sugestão):** Implementar máscara de CPF com formatação automática (XXX.XXX.XXX-XX) e validação dos dígitos verificadores.

**Esforço:** Baixo

---

#### 0.1.3 Telefone — Formulário de criação e edição de cliente

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/app/(dashboard)/clients/list/page.tsx` | 401-406 | **MODERADO** | Campo WhatsApp/Telefone sem máscara. Placeholder `"(11) 99999-9999"` orienta mas não formata. Schema Zod aceita string opcional sem validação de formato. |
| `src/app/(dashboard)/clients/list/page.tsx` | 316-320 | **MODERADO** | Edição de telefone no modal de edição: `onChange` com `e.target.value` cru, sem formatação. |

**Antes:** `<Input {...register('phone')} placeholder="(11) 99999-9999" />`
**Depois (sugestão):** Máscara de telefone dinâmica (alterna entre 10 e 11 dígitos conforme o usuário digita o DDD). `sanitizePhone()` já existe em `src/lib/sanitize.ts:36` mas não é usado nos inputs.

**Esforço:** Baixo

---

#### 0.1.4 CPF — Portal do cliente

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/components/portal/IdentityVerification.tsx` | 32-38, 97-100 | **BAIXO** | Único campo com máscara funcional no app. Usa `formatCpf()` custom com `.replace()` encadeado. O estado armazena o valor **formatado** (com pontuação), não apenas dígitos crus. Funciona para verificação, mas padrão frágil. |

**Antes:** Estado armazena `"123.456.789-00"` em vez de `"12345678900"`
**Depois (sugestão):** Armazenar apenas dígitos crus no estado, aplicar máscara apenas na exibição.

**Esforço:** Baixo

---

#### 0.1.5 Campos Monetários — Todos os inputs de valor em R$

| # | Arquivo | Linha | Campo | Tipo atual | Severidade |
|---|---------|-------|-------|------------|------------|
| 1 | `src/components/bpc/BpcForm.tsx` | 178-188 | Renda Familiar | `type="number" step="0.01"` | **CRÍTICO** |
| 2 | `src/app/(dashboard)/cases/[id]/honorarios/page.tsx` | 283-293 | Valor Total | `type="number" step="0.01"` | **CRÍTICO** |
| 3 | `src/app/(dashboard)/cases/[id]/honorarios/page.tsx` | 294-305 | Valor Recebido | `type="number" step="0.01"` | **CRÍTICO** |
| 4 | `src/app/(dashboard)/cases/[id]/gps/page.tsx` | 238-252 | Salário de Contribuição | `type="number" step="0.01"` | **CRÍTICO** |
| 5 | `src/app/(dashboard)/cases/[id]/revisao/page.tsx` | 163-172 | RMI Concedido | `type="number" step="0.01"` | **CRÍTICO** |
| 6 | `src/app/(dashboard)/cases/[id]/simulator/page.tsx` | 509-527 | Salário de Contribuição Customizado | `type="number"` + prefixo `R$` (visual) | **CRÍTICO** |
| 7 | `src/app/(dashboard)/cases/[id]/retroativos/page.tsx` | 410-424 | Valor Mensal Devido | `type="text"` + vírgula (`replace(',', '.')`) | **CRÍTICO** |
| 8 | `src/app/(dashboard)/cases/[id]/retroativos/page.tsx` | 427-442 | Descontos Opcionais | `type="text"` + vírgula (`replace(',', '.')`) | **CRÍTICO** |
| 9 | `src/app/(dashboard)/cases/[id]/cnis/_components/modals/EditSalariesModal.tsx` | 39-49 | Valor do Salário | `type="text"` sem prefixo | **CRÍTICO** |
| 10 | `src/components/portal/PortalSimulator.tsx` | 86-99 | Contribuição Mensal | `type="number"` + ícone DollarSign | **CRÍTICO** |
| 11 | `src/app/admin/salario-minimo/page.tsx` | 133-143 | Salário Mínimo | `type="number" step="0.01"` | **MODERADO** |
| 12 | `src/app/admin/salario-minimo/page.tsx` | 144-154 | Teto Previdenciário | `type="number" step="0.01"` | **MODERADO** |
| 13 | `src/app/admin/salario-minimo/page.tsx` | 165-175 | Reajuste (%) | `type="number" step="0.01"` | **MODERADO** |

**Problema:** Nenhum campo monetário usa máscara de moeda BRL. O comportamento esperado para o domínio (valores previdenciários como salário de contribuição, RMI, renda familiar) é dígito entrando pela direita empurrando os anteriores para a esquerda (padrão "centavos"). Atualmente:
- `type="number"` exibe separador decimal americano (ponto) e sem separador de milhar
- Inputs que usam `type="text"` + vírgula (retroativos) não têm formatação durante a digitação
- Usuário pode digitar valores inconsistentes (ex: "2500.5" vs "2.500,50" vs "2500,50")

**Antes:** `<input type="number" step="0.01" value={valor} onChange={...} />`
**Depois (sugestão):** Implementar input com formatação BRL — exibe "R$ 1.234,56" enquanto o usuário digita, armazena valor numérico cru. Pode ser via lib externa (`react-number-format`, `imask`) ou componente customizado.

**Esforço:** Alto (13 campos, requer componente reutilizável)

---

#### 0.1.6 Número do Processo (CNJ)

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/app/(dashboard)/cases/[id]/_components/EditCaseModal.tsx` | 60-72 | **MODERADO** | Campo "Número do Processo" sem máscara. Placeholder `"0000000-00.0000.0.00.0000"` orienta formato CNJ de 25 caracteres. Hint textual explica o formato. Sem formatação automática durante a digitação. |

**Antes:** `<input type="text" placeholder="0000000-00.0000.0.00.0000" />`
**Depois (sugestão):** Máscara CNJ com formatação automática `NNNNNNN-DD.AAAA.J.TR.OOOO`. `parseCnjNumber()` existe em `src/lib/cnj-parser.ts` — pode ser usado como base, mas o parser existente é para leitura, não máscara.

**Esforço:** Baixo

---

#### 0.1.7 Campos ausentes (CNPJ, CEP)

**Nenhum campo de CNPJ ou CEP existe no app.** Como o domínio é jurídico corporativo, é provável que venham a ser necessários. Não são reportados como problema, apenas como observação para fases futuras.

---

### 0.2 Acessibilidade — Foco e Navegação por Teclado

#### 0.2.1 Skip-to-content link ausente

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| Toda a aplicação | — | **CRÍTICO** | Não há link "Pular para o conteúdo" (skip-to-content) em lugar nenhum. Usuários de teclado precisam tabular por toda a sidebar (11+ itens) + header antes de alcançar o conteúdo principal em cada página. WCAG 2.4.1 (Bypass Blocks). |

**Antes:** Navegação por teclado: Tab x 15+ → conteúdo principal
**Depois (sugestão):** Adicionar link "Pular para o conteúdo principal" como primeiro elemento focável no layout do dashboard, com CSS `sr-only focus:not-sr-only`. O `<main id="main-content">` já existe e tem `tabIndex={-1}` — só falta o link.

**Esforço:** Baixo

---

#### 0.2.2 Foco trapping ausente em modais e drawers

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/components/ui/Modal.tsx` | 22-54 | **CRÍTICO** | Modal não implementa foco trapping. Ao abrir, o foco não é movido para dentro do modal. Tab pode mover o foco para elementos atrás do modal. Ao fechar, o foco não é restaurado para o elemento que abriu. Only Escape é tratado. |
| `src/components/ui/Drawer.tsx` | 22-79 | **CRÍTICO** | Drawer não implementa foco trapping. Mesmo problema do Modal. Existe `drawerRef` (linha 18) mas nunca recebe foco programático. |
| `src/components/ShortcutsModal.tsx` | 14-75 | **CRÍTICO** | Modal de atalhos sem foco trapping. Escape tratado, backdrop click tratado, mas Tab sai do modal. |
| `src/components/UpgradeModal.tsx` | 13-45 | **CRÍTICO** | UpgradeModal não tem **nenhum** tratamento de teclado: sem Escape, sem foco trapping, sem foco ao abrir/fechar, sem ARIA dialog. Backdrop não fecha o modal. |
| `src/components/onboarding/OnboardingWizard.tsx` | 115-219 | **CRÍTICO** | Onboarding sem foco trapping explícito. Usa `e.stopPropagation()` no conteúdo (linha 126) mas sem gerenciamento de foco. |

**Antes:** Modal/Drawer aberto → Tab sai do componente → foco vai para elementos da página atrás da sobreposição
**Depois (sugestão):** Implementar hook `useFocusTrap()` que: (1) move foco para o primeiro elemento focável ao abrir, (2) mantém foco cíclico dentro do componente via Tab/Shift+Tab, (3) restaura foco ao elemento de origem ao fechar. Aplicar a todos os 5 componentes.

**Esforço:** Médio

---

#### 0.2.3 Input.tsx — Label sem associação programática

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/components/ui/Input.tsx` | 16-20 | **CRÍTICO** | `<label>` envolve o texto do label mas não tem atributo `htmlFor`. O `<input>` não tem atributo `id`. Não há uso de `useId()` do React. Leitores de tela não associam o label ao input. Este padrão se replica em todo input que usa este componente. |

**Antes:**
```tsx
<label className="neo-label">{label}</label>
<input className="neo-input" {...props} />
```
**Depois (sugestão):**
```tsx
const id = useId()
<label htmlFor={id} className="neo-label">{label}</label>
<input id={id} className="neo-input" {...props} />
```

**Esforço:** Baixo (mudança localizada no componente Input.tsx)

---

#### 0.2.4 Input.tsx — Erro de validação não associado

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/components/ui/Input.tsx` | 20, 29-31 | **MODERADO** | A mensagem de erro `<p>` é renderizada visualmente após o input mas sem `aria-describedby` vinculando ao input. O input também não recebe `aria-invalid="true"` quando `error` está presente. Leitores de tela não anunciam o erro automaticamente. |

**Antes:** `<input ... />` + `<p className="text-red-500 text-sm">{error}</p>` (sem associação)
**Depois (sugestão):** `<input aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} ... />` + `<p id={`${id}-error`} ...>{error}</p>`

**Esforço:** Baixo

---

#### 0.2.5 Notificações no Header não acessíveis por teclado

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/components/Header.tsx` | 160-170 | **CRÍTICO** | Cada notificação é um `<div>` com `onClick` — não é focável por teclado. Usuários de teclado não conseguem interagir com notificações individuais. |
| `src/components/Header.tsx` | 144-183 | **MODERADO** | O dropdown de notificações não tem `role="listbox"`, `role="menu"` ou `aria-label`. Leitores de tela não identificam o propósito do elemento ao focá-lo. |

**Antes:** `<div onClick={...} className="...">{...}</div>` (não focável)
**Depois (sugestão):** `<button onClick={...} className="... w-full text-left">{...}</button>` ou `<div role="button" tabIndex={0} onKeyDown={...} onClick={...}>`

**Esforço:** Baixo

---

#### 0.2.6 UpgradeModal — Sem atributos ARIA de dialog

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/components/UpgradeModal.tsx` | 13-45 | **CRÍTICO** | Modal customizado completamente sem ARIA: sem `role="dialog"`, sem `aria-modal`, sem `aria-label`/`aria-labelledby`. Botão "Fechar" não tem `aria-label`. Nenhum tratamento de teclado. |

**Antes:** `<div className="fixed inset-0 ...">{...}</div>` (sem atributos ARIA)
**Depois (sugestão):** `<div role="dialog" aria-modal="true" aria-label="Plano e assinatura" ...>`

**Esforço:** Baixo

---

#### 0.2.7 Abas do Caso — Sem role="tablist"

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/app/(dashboard)/cases/[id]/layout.tsx` | 122-153 | **MODERADO** | A navegação por abas usa `<a>` estilizadas visualmente como tabs mas sem `role="tablist"`, `role="tab"`, `aria-selected`. O estado visual ativo (`border-amber-500`) não tem contraparte programática para leitores de tela. |

**Antes:** `<nav>` com `<Link>` sem atributos de tab
**Depois (sugestão):** `<div role="tablist">` com cada aba tendo `role="tab"` e `aria-selected={isActive}`.

**Esforço:** Médio

---

#### 0.2.8 Abas bloqueadas do Caso — Sem aria-disabled

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/app/(dashboard)/cases/[id]/layout.tsx` | 132-149 | **MODERADO** | Abas bloqueadas por plano usam `opacity-60 cursor-not-allowed` e `href="#"` mas continuam focáveis via Tab. Não têm `aria-disabled="true"`. Usuário de teclado pode "clicar" em aba bloqueada sem feedback. |

**Antes:** `<Link href="#" className="opacity-60 cursor-not-allowed">`
**Depois (sugestão):** `<Link href="#" aria-disabled={tab.locked} tabIndex={tab.locked ? -1 : 0}>`

**Esforço:** Baixo

---

#### 0.2.9 Filtros na listagem de Casos — Labels sem associação

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/app/(dashboard)/cases/page.tsx` | 193-233 | **MODERADO** | 3 `<select>` (Status, Prioridade, Tipo) e 4 `<input>` (RMI min, RMI max, data início, data fim) têm labels visualmente presentes mas sem `htmlFor`/`id` para associação programática. |

**Antes:** `<label className="block...">Status</label><select>...</select>` (sem associação)
**Depois (sugestão):** `<label htmlFor="filter-status">Status</label><select id="filter-status">...</select>`

**Esforço:** Baixo

---

#### 0.2.10 Header — Botão sidebar sem aria-expanded

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/components/Header.tsx` | 96 | **BAIXO** | Botão de alternância do sidebar não tem `aria-expanded` para indicar se o menu está aberto ou fechado. |

**Antes:** `<button aria-label="Alternar menu de navegação" onClick={...}>`
**Depois (sugestão):** `<button aria-expanded={isOpen} aria-label="Alternar menu de navegação" onClick={...}>`

**Esforço:** Baixo

---

#### 0.2.11 Contraste — amber-600 em fundo branco

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `tailwind.config.ts` | 17 | **MODERADO** | `brand.accent: '#d97706'` (amber-600). Usado como cor de links de texto (ex: "Esqueci minha senha", "Cadastre-se grátis" no login). Taxa de contraste contra branco: ~3.2:1 — falha WCAG AA para texto normal (exige 4.5:1). |

**Antes:** `text-amber-600` em links de texto pequeno
**Depois (sugestão):** `text-amber-700` (#b45309) para links de texto normal, mantendo `text-amber-600` apenas para ícones e elementos grandes.

**Esforço:** Baixo

---

#### 0.2.12 Foco visível — Anéis de foco com 20% de opacidade

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/app/(dashboard)/cases/page.tsx` | 174 | **MODERADO** | `focus:ring-amber-500/20` — anel de foco a 20% de opacidade é quase invisível. Falha WCAG 2.4.7 (Focus Visible). Padrão replicado em login/register (ex: `src/app/(auth)/login/page.tsx:158`). |

**Antes:** `focus:ring-amber-500/20` (20% opacity)
**Depois (sugestão):** `focus:ring-amber-500/50` (50% opacity) ou `focus:ring-amber-500` com outline.

**Esforço:** Baixo

---

#### 0.2.13 ActionsDropdown — Sem navegação por setas

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/components/ui/ActionsDropdown.tsx` | 42-82 | **MODERADO** | Dropdown tem `role="menu"` e `role="menuitem"` corretos mas não implementa navegação por setas Up/Down entre itens. Usuário precisa tabular por todos os itens. Padrão WAI-ARIA Menu exige setas. |

**Antes:** Tab por cada item (sem atalho de teclado)
**Depois (sugestão):** Implementar `onKeyDown` com ArrowUp/ArrowDown para navegação entre `menuitem`, Home/End para primeiro/último.

**Esforço:** Baixo

---

#### 0.2.14 CaseFloatingActions — Sem Escape key

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/components/case/CaseFloatingActions.tsx` | 14-142 | **MODERADO** | Speed-dial do FAB trata clique fora para fechar mas não trata tecla Escape para fechar via teclado. |
| `src/components/client/ClientFloatingActions.tsx` | 18-59+ | **MODERADO** | Mesmo padrão. |

**Antes:** FAB aberto → usuário precisa clicar fora para fechar
**Depois (sugestão):** Adicionar `onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}` no container.

**Esforço:** Baixo

---

## Fase 1 — Tela de Casos (Reorganização de Menu)

### 1.1 Navegação por abas — Quantidade excessiva

| Arquivo | Linha(s) | Severidade | Descrição |
|---------|----------|------------|-----------|
| `src/app/(dashboard)/cases/[id]/layout.tsx` | 50-85 | **MODERADO** | 13-14 abas em scroll horizontal único. O array `tabs` define 14 itens (1 condicional). Em mobile (<768px), o usuário precisa rolar horizontalmente por toda a lista para encontrar a aba desejada. Não há indicação visual "mais abas à direita" (fade gradiente ou seta de scroll). |

**Problema de UX:** O número excessivo de abas cria sobrecarga cognitiva. O usuário precisa escanear 14 opções para navegar. Abas de baixa prioridade (ex: Assinatura, BPC/LOAS condicional) ocupam espaço equivalente às abas de alta frequência (Visão Geral, CNIS, Cálculos).

**Antes:** Lista linear de 14 abas com scroll horizontal
**Depois (sugestão):** 
- **Grupo 1 (essenciais):** Visão Geral, CNIS, Cálculos, Simulação, GPS/DAS
- **Grupo 2 (análise):** Comparar, Prescrição, Honorários, Revisão, Retroativos
- **Grupo 3 (documentos):** Timeline, PDF, Assinatura
- 1-2 abas principais podem ser movidas para o FAB em vez de aba
- Adicionar fade gradiente à direita do container de scroll indicando que há mais conteúdo

**Esforço:** Médio

---

### 1.2 FAB duplica funcionalidade das abas

| Arquivo | Linha(s) | Severidade | Descrição |
|---------|----------|------------|-----------|
| `src/components/case/CaseFloatingActions.tsx` | 1-142 | **MODERADO** | O FAB oferece acesso a "Prontuário" (notes), "Checklist", "Parecer IA" (opinions), "Petição Inicial" (peticao) — mas estas funcionalidades ou têm abas dedicadas ou deveriam estar integradas à navegação principal. Há sobreposição de mecanismos de navegação sem critério claro de quando usar um ou outro. |

**Problema de UX:** Novos usuários podem nunca descobrir o FAB (botão flutuante no canto inferior direito sem indicação externa). Ao mesmo tempo, usuários que descobrem o FAB podem usá-lo para acessar drawers sem saber que poderiam encontrar as mesmas funções via abas.

**Antes:** Tooltip "Prontuário" no FAB + aba "Notes" na navegação
**Depois (sugestão):** Decidir um padrão único:
- **Drawers (FAB):** ações auxiliares que não são páginas completas (Prontuário, Checklist). Manter no FAB como speed-dial.
- **Abas:** páginas completas com rota própria (CNIS, Cálculos, Simulação, GPS/DAS, etc.)
- Eliminar duplicidade removendo drawers da navegação por abas se forem acessíveis apenas via FAB.

**Esforço:** Baixo (decisão de design, não código)

---

### 1.3 Ordem das abas — Agrupamento por fluxo de trabalho

| Arquivo | Linha(s) | Severidade | Descrição |
|---------|----------|------------|-----------|
| `src/app/(dashboard)/cases/[id]/layout.tsx` | 50-85 | **BAIXO** | A ordem atual das abas mistura frequência de uso: "Retroativos" (aba 5) aparece antes de "Prescrição" (aba 7) e "Honorários" (aba 8), mas depois de "Simulação" (aba 4). Não há um agrupamento lógico claro. |

**Problema de UX:** Um advogado previdenciário tipicamente segue o fluxo: (1) analisar CNIS → (2) calcular → (3) simular → (4) ver prescrição → (5) calcular retroativo → (6) ver honorários. A ordem atual é diferente: Calculos(3), Simulação(4), Retroativos(5), Comparar(6), Prescrição(7), Honorários(8) — "Comparar" entre Retroativos e Prescrição quebra o fluxo natural.

**Antes:** Calculos → Simulação → Retroativos → Comparar → Prescrição → Honorários
**Depois (sugestão):** Calculos → Simulação → Prescrição → Retroativos → Honorários → Comparar
(Motivo: o fluxo natural é calcular → simular → ver prescrição (limitação temporal) → calcular retroativo (se aplicável) → ver honorários (percentuais sobre valor) → comparar cenários.)

**Esforço:** Baixo

---

### 1.4 Sidebar sem agrupamento visual

| Arquivo | Linha(s) | Severidade | Descrição |
|---------|----------|------------|-----------|
| `src/components/Sidebar.tsx` | 68-205 | **BAIXO** | 11 itens em lista plana sem separadores categoriais. Ferramentas (`/tools/pdf`, `/tools/cnis-indicators`) e configurações (`/settings/billing`, `/settings/profile`) se misturam com navegação primária. |

**Antes:** Lista linear: Dashboard, Clientes, Kanban, Casos, Relatórios, Prazos, Atividade, Ferramentas PDF, Dicionário CNIS, Plano, Perfil
**Depois (sugestão):**
- **Principal:** Dashboard, Clientes, Casos, Relatórios
- **Acompanhamento:** Prazos, Atividade
- **Ferramentas:** Ferramentas PDF, Dicionário CNIS
- **Configurações:** Plano, Perfil

Adicionar labels de grupo ou separadores visuais sutis (ex: `border-t border-slate-200` + texto "Ferramentas" em `text-xs uppercase text-slate-400`).

**Esforço:** Baixo

---

### 1.5 Perfil no Header não é clicável

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/components/Header.tsx` | 188 | **BAIXO** | O avatar e nome do usuário no Header são um `<button>` sem ação (`onClick` vazio). Não redireciona para `/settings/profile`. O usuário precisa lembrar de ir ao sidebar para acessar as configurações de perfil. |

**Antes:** `<button className="flex items-center ..."> (onClick vazio)`
**Depois (sugestão):** `<Link href="/settings/profile">` ou `<button onClick={() => router.push('/settings/profile')}>`

**Esforço:** Baixo

---

### 1.6 Admin layout sem destaque de rota ativa

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/app/admin/layout.tsx` | 50-100 | **BAIXO** | O layout admin não implementa `pathname.startsWith()` ou qualquer indicação visual de página ativa. Todos os links têm a mesma aparência independente da rota atual. |

**Antes:** Todos os itens com mesma classe CSS
**Depois (sugestão):** Mesmo padrão do sidebar do dashboard: `pathname.startsWith(item.href)` → classe `bg-amber-50 text-amber-700` + `aria-current="page"`.

**Esforço:** Baixo

---

## Fase 2 — Componentes de Data

### 2.1 Ausência de DatePicker padronizado

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| Vários (ver abaixo) | — | **MODERADO** | 15 ocorrências de `<input type="date">` nativo espalhadas por páginas individuais, sem componente DatePicker reutilizável em `src/components/ui/`. |

**Problema de UX/UI:**
1. `<input type="date">` nativo renderiza de forma diferente em cada browser/OS
2. Sem validação consistente de intervalo entre páginas
3. Sem formatação pt-BR consistente no display
4. Duplicação de lógica de parse de data em cada página

**Ocorrências de `<input type="date">`:**

| # | Arquivo | Linha | Finalidade |
|---|---------|-------|------------|
| 1 | `cases/[id]/_components/EditCaseModal.tsx` | 53 | Prazo do caso (deadlineDate) |
| 2 | `cases/[id]/prescricao/page.tsx` | 138 | Data do fato gerador |
| 3 | `cases/[id]/simulator/page.tsx` | 462 | DIB projetada |
| 4 | `cases/[id]/calculator/page.tsx` | 574 | DIB pretendida |
| 5 | `cases/[id]/revisao/page.tsx` | 177 | DIB concedida |
| 6 | `cases/[id]/retroativos/page.tsx` | 392 | Data início do direito |
| 7 | `cases/[id]/retroativos/page.tsx` | 402 | Data de cálculo/requerimento |
| 8 | `cases/[id]/honorarios/page.tsx` | 311 | Vencimento de honorário |
| 9 | `cases/page.tsx` | 229 | Filtro "Criado a partir de" |
| 10 | `cases/page.tsx` | 233 | Filtro "Criado até" |
| 11 | `clients/list/page.tsx` | 395 | Data de nascimento do cliente |
| 12 | `admin/salario-minimo/page.tsx` | 126 | Vigência do salário mínimo |
| 13 | `admin/regras-aposentadoria/page.tsx` | 209 | Vigência da regra |
| 14 | `portal/PortalSimulator.tsx` | 79 | Data pretendida |
| 15 | `portal/IdentityVerification.tsx` | 121 | Data de nascimento |

**Antes:** 15 `<input type="date">` independentes, cada um com seu próprio `min`/`max`/validação
**Depois (sugestão):** Componente `DatePicker` reutilizável em `src/components/ui/DatePicker.tsx`:
- Wrapper sobre `<input type="date">` ou calendário customizado
- i18n pt-BR (nomes de meses, dias da semana)
- Props: `value`, `onChange`, `minDate`, `maxDate`, `label`, `error`, `disabled`
- Deve aceitar tanto `Date` quanto string ISO como value
- Validação consistente de intervalo

**Esforço:** Médio

---

### 2.2 MonthPicker customizado no GPS — Inconsistente

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/app/(dashboard)/cases/[id]/gps/page.tsx` | 41-79 | **BAIXO** | A página de GPS implementa um `MonthPicker` customizado com dois `<select>` (mês e ano), enquanto todas as outras páginas usam `<input type="date">`. Inconsistência de componente de data na mesma aplicação. |

**Antes:** Dois dropdowns `<select>` para mês + ano
**Depois (sugestão):** Se for necessário selecionar apenas mês/ano (sem dia), considerar estender o DatePicker proposto em 2.1 para suportar `mode="month"`. Alternativamente, manter o MonthPicker mas extraí-lo para componente reutilizável em `src/components/ui/MonthPicker.tsx`.

**Esforço:** Baixo

---

### 2.3 Duas bibliotecas de data concorrentes

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/lib/utils.ts` | 16-47 | **BAIXO** | `formatDate()` e `formatDateTime()` usam `Intl.DateTimeFormat('pt-BR')` nativo. |
| `cases/[id]/prescricao/page.tsx` | 6-7 | **BAIXO** | Importa `date-fns`: `differenceInDays`, `addYears`, `format`, `parseISO`, `isValid`, `ptBR`. |
| `cases/[id]/timeline/page.tsx` | 11-12 | **BAIXO** | Importa `date-fns`: `format`, `ptBR`. |
| `cases/[id]/honorarios/page.tsx` | 11 | **BAIXO** | Importa `date-fns`: `format`, `parseISO`. |

**Problema:** Duas abordagens concorrentes para formatar/exibir datas. `src/lib/utils.ts` fornece `formatDate()` usando `Intl.DateTimeFormat` (usado em ~20 lugares), mas 3 páginas importam `date-fns` diretamente para operações que o utilitário não cobre (diferença entre datas, adição de anos).

**Antes:** `formatDate()` do utils para exibição + `date-fns` para cálculo
**Depois (sugestão):** Expandir `src/lib/utils.ts` com funções auxiliares de data que cubram os casos de uso atuais: `formatDate()`, `formatDateTime()`, `daysBetween()`, `addYears()`, `isValidDate()`, `dateToISO()`. Opcionalmente, consolidar toda manipulação de data em um único `src/lib/date.ts` com `date-fns` como dependência única, eliminando o `Intl.DateTimeFormat` manual.

**Esforço:** Baixo

---

### 2.4 Timezone naive — Potencial para data incorreta

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/lib/utils.ts` | 25-28 | **MODERADO** | `formatDate()` faz parse manual de `YYYY-MM-DD` com `new Date(year, month - 1, day)` (correto, evita timezone shift), mas `CaseInfoCard.tsx:19` usa `new Date(caseData.deadlineDate) < new Date()` diretamente (pode sofrer timezone shift se a string não vier em UTC). |
| Várias páginas | — | **MODERADO** | Uso inconsistente de `new Date(string)` direto vs parse manual. A maioria das páginas e APIs usa `new Date(stringISO)` sem tratamento de timezone. Se o servidor envia datas em UTC `2026-01-15T00:00:00.000Z`, o `new Date()` pode interpretar como dia anterior em timezone -03:00 (Brasil). |

**Antes:** `new Date(caseData.deadlineDate)` em `CaseInfoCard.tsx` — sujeito a timezone shift
**Depois (sugestão):** (1) Criar função `parseDateBR(dateString: string)` que lida com timezone explicitamente; (2) Garantir que todas as datas trafeguem como `YYYY-MM-DD` (apenas data, sem hora) para evitar ambiguidade de timezone; (3) Usar `setHours(0, 0, 0, 0)` em comparações.

**Esforço:** Médio (requer revisão de todas as APIs + páginas)

---

### 2.5 Lógica de "dias restantes" duplicada

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/components/dashboard/DashboardDeadlines.tsx` | 28-29 | **BAIXO** | Cálculo inline de dias restantes: `const daysLeft = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))` |
| `src/app/(dashboard)/deadlines/page.tsx` | 38 | **BAIXO** | Cálculo similar inline |
| `src/app/(dashboard)/calendar/page.tsx` | 46-53 | **BAIXO** | Função `isUrgent` com lógica similar |

**Antes:** 3 implementações independentes da mesma lógica com possíveis divergências de arredondamento
**Depois (sugestão):** Função utilitária compartilhada: `daysUntil(date: Date | string): number` em `src/lib/utils.ts` ou `src/lib/date.ts`.

**Esforço:** Baixo

---

## Fase 3+ — Demais Inconsistências de UX/UI

### 3.1 Telas de Caso — Loading states inconsistentes

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| Vários | — | **MODERADO** | As sub-páginas de caso (calculator, simulador, retroativos, cnis, gps, revisao, etc. — ~16 páginas) não têm `loading.tsx` próprio e usam um `Loader2` spinner inline inconsistente. Enquanto isso, a listagem de casos tem um skeleton dedicado em `src/app/(dashboard)/cases/loading.tsx`. |

**Páginas sem `loading.tsx`:** `calculator`, `simulator`, `retroativos`, `cnis`, `gps`, `revisao`, `assinatura`, `checklist`, `compare`, `honorarios`, `notes`, `opinions`, `pdf`, `prescricao`, `timeline`, `bpc`, além de `dashboard`, `reports`, `calendar`, `tools/cnis-indicators`, `tools/pdf`, `clients/import`, `clients/kanban`.

**Antes:** Inline `<Loader2 className="animate-spin" />` em 16+ sub-páginas de caso
**Depois (sugestão):** Adicionar `loading.tsx` skeleton consistente para cada grupo de página. O componente `Skeleton` já existe em `src/components/ui/Skeleton.tsx` com variantes `TableSkeleton`, `CardSkeleton`, `DetailSkeleton`.

**Esforço:** Alto (23+ arquivos)

---

### 3.2 Error boundaries insuficientes

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| Vários | — | **MODERADO** | Apenas 1 `error.tsx` global existe em `src/app/(dashboard)/error.tsx`. Apenas 5 páginas usam o componente `ErrorBoundary` (`clients/list`, `clients/list/[id]`, `deadlines`, `settings/billing`, `settings/profile`). As 17+ páginas restantes (incluindo todas as sub-páginas de caso) não têm ErrorBoundary. |

**Páginas sem ErrorBoundary/error.tsx:** `cases`, `cases/[id]`, `calculator`, `simulator`, `retroativos`, `cnis`, `gps`, `revisao`, `assinatura`, `dashboard`, `reports`, `calendar`, `activity`, `clients/import`, `clients/kanban`, `tools/pdf`, `tools/cnis-indicators`.

**Antes:** Erro não capturado em calculator → todo o dashboard quebra (error.tsx global)
**Depois (sugestão):** Adicionar `error.tsx` granular para rotas de alta criticidade (cálculos, simulação, CNIS) ou envolver cada sub-página em `<ErrorBoundary>` com fallback específico para a funcionalidade.

**Esforço:** Médio

---

### 3.3 alert() e confirm() — Diálogos nativos do browser

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/app/(dashboard)/cases/[id]/calculator/page.tsx` | 282, 305 | **MODERADO** | `alert("Primeiro faça upload do CNIS para realizar os cálculos.")` — validação de CNIS usa diálogo nativo do browser em vez de toast/modal in-app. |
| `src/app/(dashboard)/cases/[id]/retroativos/page.tsx` | 169 | **MODERADO** | `confirm("Tem certeza que deseja excluir este cálculo retroativo?")` — confirmação de exclusão usa diálogo nativo em vez de modal de confirmação in-app. |

**Antes:** `alert("...")` e `confirm("...")` — diálogos que não seguem o design system, não são estilizáveis e têm comportamento inconsistente entre browsers.
**Depois (sugestão):** Substituir por Modal de confirmação (`<Modal title="Confirmar exclusão">`) e Toast de erro/sucesso (`<Toast>`). O `ToastContainer` já existe e o `Modal` também.

**Esforço:** Baixo

---

### 3.4 Valores fixos de piso/teto previdenciário

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/app/(dashboard)/cases/[id]/calculator/page.tsx` | 507, 511 | **MODERADO** | `pisoTemp = 1621` e `tetoTemp = 8157.41` — valores hardcoded do salário mínimo e teto RGPS. Estes valores mudam anualmente (e às vezes no meio do ano). |
| `src/app/(dashboard)/cases/[id]/simulator/page.tsx` | 73 | **MODERADO** | `MIN_SALARIO = 1621.00` e `MAX_SALARIO = 8157.41` — mesmo problema. |

**Problema:** A API `/salario-minimo` é consultada, mas os valores iniciais são hardcoded. Se a API falhar ou demorar, valores desatualizados são usados em cálculos previdenciários, podendo gerar resultados incorretos.

**Antes:** `const pisoTemp = 1621` (hardcoded, sujeito a desatualização)
**Depois (sugestão):** Buscar valores na inicialização com fallback explícito (exibir warning se fallback for usado). Ou: tornar a busca obrigatória (sem fallback) e mostrar loading/states de erro.

**Esforço:** Baixo

---

### 3.5 Ordenação client-side de dados paginados

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/app/(dashboard)/cases/page.tsx` | 143-158 | **BAIXO** | A ordenação de colunas (cliente, status, prioridade, prazo, criação) é feita client-side via `.sort()` no array filtrado. Como a listagem é paginada (20 itens), a ordenação só afeta a página atual, não o dataset completo. |

**Antes:** `filtered.sort((a, b) => ...)` — ordena apenas os 20 itens da página atual
**Depois (sugestão):** Enviar parâmetro `sortBy` e `sortOrder` para a API e fazer a ordenação server-side no Prisma `orderBy`.

**Esforço:** Médio

---

### 3.6 Cores não-padrão do Tailwind

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/app/(dashboard)/tools/pdf/page.tsx` | 494 | **BAIXO** | `text-red-650` e `border-red-150` — tokens que NÃO existem no Tailwind v3. Não terão efeito ou podem quebrar com atualizações. |
| `src/app/(dashboard)/tools/pdf/page.tsx` | 457 | **BAIXO** | `text-slate-450` — token inexistente. |
| `src/app/admin/layout.tsx` | 74 | **BAIXO** | `bg-[#F8FAFC]` — equivalente a `bg-slate-50`, mas usando valor arbitrário em vez de token do tema. |

**Antes:** `text-red-650` (não é um token Tailwind válido) / `bg-[#F8FAFC]` (valor arbitrário)
**Depois (sugestão):** Substituir por tokens válidos: `text-red-600`, `border-red-200`, `bg-slate-50`, etc.

**Esforço:** Baixo

---

### 3.7 Tamanhos de fonte arbitrários

| Arquivo(s) | Severidade | Descrição |
|------------|------------|-----------|
| 20+ arquivos | **BAIXO** | Mais de 35 ocorrências de `text-[10px]`, `text-[11px]`, `text-[9px]`, `text-[15px]` em vez de tokens da escala de tipografia Tailwind (`text-xs` = 12px, `text-sm` = 14px). |

**Ocorrências mais frequentes:** `text-[10px]` (~20x), `text-[11px]` (~5x), `text-[9px]` (~3x), `text-[15px]` (~2x).

**Antes:** `text-[10px]` (valor arbitrário fora da escala)
**Depois (sugestão):** Usar `text-xs` (12px) para a maioria dos casos de `text-[10px]` (a diferença de 2px é imperceptível e ganha consistência visual). Para os casos onde 10px é realmente necessário, documentar o motivo no componente.

**Esforço:** Baixo

---

### 3.8 Toast ID não seguro

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/store/toast.ts` | 19 | **BAIXO** | `id: Math.random().toString(36).slice(2)` — geração de ID não criptográfica com potencial de colisão em cenários de alta frequência (múltiplos toasts simultâneos). |

**Antes:** `id: Math.random().toString(36).slice(2)`
**Depois (sugestão):** `id: crypto.randomUUID()` ou contador incremental (`let nextId = 0; id: ++nextId`).

**Esforço:** Baixo

---

### 3.9 Empty catch — Erro de fetch silenciado

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/app/(dashboard)/cases/page.tsx` | 106 | **MODERADO** | `catch { /* noop */ }` — o bloco catch vazio engole qualquer erro da API de listagem de casos. Se a requisição falhar, o usuário vê uma tela vazia sem feedback de erro ou tentativa de retry. |

**Antes:** `catch { /* noop */ }` — erro silenciosamente ignorado
**Depois (sugestão):** `catch (err) { setError('Erro ao carregar casos. Tente novamente.'); console.error('Fetch cases error:', err); }`

**Esforço:** Baixo

---

### 3.10 Filtro de casos sem aria-expanded

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/app/(dashboard)/cases/page.tsx` | 177-184 | **BAIXO** | O botão de toggle do painel de filtros não tem `aria-expanded`. Usuários de leitor de tela não sabem se o painel está aberto ou fechado. |

**Antes:** `<button onClick={toggleFilters}>Filtros</button>`
**Depois (sugestão):** `<button aria-expanded={filtersOpen} onClick={toggleFilters}>Filtros</button>`

**Esforço:** Baixo

---

### 3.11 Modal e Drawer sem aria-labelledby

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/components/ui/Modal.tsx` | 36 | **BAIXO** | `role="dialog"` e `aria-modal="true"` presentes, mas falta `aria-labelledby` apontando para o `<h2>` do título. Leitor de tela não anuncia o título do diálogo ao abrir. |
| `src/components/ui/Drawer.tsx` | 37 | **BAIXO** | Mesmo problema: sem `aria-labelledby` apontando para o título. |

**Antes:** `role="dialog" aria-modal="true"` (sem referência ao título)
**Depois (sugestão):** `aria-labelledby="modal-title"` no container e `id="modal-title"` no título.

**Esforço:** Baixo

---

## Fase 4 — Integrações




### 4.2 Google Calendar — Timezone em eventos all-day

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/services/google-calendar.ts` | 54-73 | **BAIXO** | Eventos são criados como all-day (propriedade `date`) mas com `setHours(9, 10)` redundante que é sobrescrito pela string ISO. Sem timezone explícito — eventos podem aparecer no dia anterior em fusos -03:00. |

**Antes:** `start: { date: eventDate.toISOString().split('T')[0] }` + `eventDate.setHours(9)` (redundante)
**Depois (sugestão):** Remover `setHours(9,10)` já que all-day events ignoram hora. Adicionar `timeZone: 'America/Sao_Paulo'` no objeto do evento se necessário.

**Esforço:** Baixo

---

### 4.3 OpenAI — Fallback placeholder silencioso

| Arquivo | Linha | Severidade | Descrição |
|---------|-------|------------|-----------|
| `src/lib/openai.ts` | 8 | **BAIXO** | `apiKey: process.env.OPENAI_API_KEY || 'placeholder'` — se a chave não estiver configurada, o fallback `'placeholder'` vai gerar erros de API confusos em vez de uma mensagem de configuração clara. |

**Antes:** `apiKey: process.env.OPENAI_API_KEY || 'placeholder'`
**Depois (sugestão):** `if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada')` e usar a chave diretamente.

**Esforço:** Baixo

---

### 4.4 Oportunidades de integração (domínio jurídico)

Baseado nas integrações já existentes e no domínio (direito previdenciário corporativo), as seguintes integrações seriam naturais:

| Integração | Justificativa | Complexidade |
|------------|---------------|-------------|
| **PJE (Processo Judicial Eletrônico) CNJ** | O app já tem parser CNJ. Consulta direta ao PJE eliminaria dependência de intermediário para tribunais que usam PJE. | Alta |
| **DataJud (CNJ)** | Base estatística oficial do Judiciário. Permitiria enriquecer análises de sucesso com dados reais de cada tribunal/juiz. | Média |
| **API do INSS (Meu INSS / serviço público)** | Consulta direta de CNIS, extratos, e resultados de requerimentos. Eliminaria dependência de upload manual de PDF. | Alta |
| **Sistema de tribunais estaduais (TJSP, TJRJ, etc.)** | Cada tribunal tem API própria para consulta processual. Integração direta seria mais resiliente. | Alta (cada tribunal) |
| **E-noticiado / Diário de Justiça Eletrônico (DJE)** | Publicação de intimações. Permitiria monitoramento automático de intimações sem depender de webhook. | Média |

> **Nota:** Nenhuma dessas integrações deve ser iniciada sem estudo de viabilidade técnica e jurídica. São oportunidades mapeadas, não recomendações de implementação imediata.

---

## Resumo por Fase e Esforço

### Fase 0 — CRÍTICO (Acessibilidade + Máscaras)

| # | Item | Esforço |
|---|------|---------|
| 0.1.5 | Máscaras monetárias (13 campos) | Alto |
| 0.2.1 | Skip-to-content link | Baixo |
| 0.2.2 | Foco trapping em modais/drawers (5 componentes) | Médio |
| 0.2.3 | Input.tsx: htmlFor + id | Baixo |
| 0.2.4 | Input.tsx: aria-describedby + aria-invalid | Baixo |
| 0.2.5 | Notificações do Header acessíveis por teclado | Baixo |
| 0.2.6 | UpgradeModal: ARIA dialog attributes | Baixo |
| 0.2.7 | Abas do Caso: role="tablist" | Médio |
| 0.2.8 | Abas bloqueadas: aria-disabled | Baixo |
| 0.2.9 | Filtros da listagem: htmlFor + id | Baixo |
| 0.2.11 | Contraste amber-600 → amber-700 | Baixo |
| 0.2.12 | Anéis de foco 20% → 50% opacidade | Baixo |
| 0.2.13 | ActionsDropdown: navegação por setas | Baixo |
| 0.2.14 | FAB: handler Escape key | Baixo |
| 0.1.2 | Máscara CPF (criação de cliente) | Baixo |
| 0.1.3 | Máscara telefone (criação/edição cliente) | Baixo |
| 0.1.6 | Máscara CNJ processo | Baixo |
| 0.2.10 | aria-expanded no toggle sidebar | Baixo |

### Fase 1 — Tela de Casos

| # | Item | Esforço |
|---|------|---------|
| 1.1 | Agrupamento de abas (excesso) | Médio |
| 1.2 | FAB vs abas (duplicidade) | Baixo |
| 1.3 | Reordenar abas por fluxo de trabalho | Baixo |
| 1.4 | Sidebar com grupos visuais | Baixo |
| 1.5 | Perfil do Header clicável | Baixo |
| 1.6 | Admin: destaque de rota ativa | Baixo |

### Fase 2 — Componentes de Data

| # | Item | Esforço |
|---|------|---------|
| 2.1 | DatePicker padronizado | Médio |
| 2.2 | MonthPicker inconsistente | Baixo |
| 2.3 | Duas libs de data concorrentes | Baixo |
| 2.4 | Timezone naive | Médio |
| 2.5 | Lógica "dias restantes" duplicada | Baixo |

### Fase 3+ — Demais Inconsistências

| # | Item | Esforço |
|---|------|---------|
| 3.1 | Loading states inconsistentes (23+ páginas) | Alto |
| 3.2 | Error boundaries insuficientes | Médio |
| 3.3 | alert()/confirm() nativos | Baixo |
| 3.4 | Piso/teto previdenciário hardcoded | Baixo |
| 3.5 | Ordenação client-side de dados paginados | Médio |
| 3.6 | Cores não-padrão Tailwind | Baixo |
| 3.7 | Tamanhos de fonte arbitrários | Baixo |
| 3.8 | Toast ID não seguro | Baixo |
| 3.9 | Empty catch (fetch de casos) | Baixo |
| 3.10 | Filtro sem aria-expanded | Baixo |
| 3.11 | Modal/Drawer sem aria-labelledby | Baixo |

### Fase 4 — Integrações

| # | Item | Esforço |
|---|------|---------|

| 4.2 | Google Calendar: timezone | Baixo |
| 4.3 | OpenAI: fallback placeholder | Baixo |
| 4.4 | Oportunidades de integração (pesquisa) | — |

---

## Contagem Final

| Severidade | Total |
|------------|-------|
| CRÍTICO | 13 |
| MODERADO | 23 |
| BAIXO | 17 |
| **Total** | **53** |

| Fase | Itens | Esforço predominante |
|------|-------|---------------------|
| Fase 0 | 17 | Baixo/Médio (1 Alto) |
| Fase 1 | 6 | Baixo |
| Fase 2 | 5 | Baixo/Médio |
| Fase 3 | 11 | Baixo (1 Alto, 2 Médio) |
| Fase 4 | 4 | Baixo |
