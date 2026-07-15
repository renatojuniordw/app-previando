# Descoberta do menu de ações (ActionsDropdown) — Design

## Contexto

O `ActionsDropdown` (`src/components/ui/ActionsDropdown.tsx`) é um botão kebab (`⋯`) que esconde ações
importantes (editar, alterar status, exportar PDF, excluir, etc.) atrás de um clique. Essa decisão reduz
poluição visual, mas não deixa nenhuma pista para usuários que nunca usaram o sistema — o único rótulo
existente é um `aria-label` ("Abrir menu de ações"), que só ajuda leitores de tela.

O componente é usado em 6 pontos do projeto:

- `src/app/(dashboard)/cases/[id]/_components/CaseInfoCard.tsx` — instância única
- `src/app/(dashboard)/cases/[id]/calculator/page.tsx` — instância única
- `src/app/(dashboard)/deadlines/page.tsx` — instância única
- `src/app/(dashboard)/cases/[id]/cnis/_components/PeriodItem.tsx` — repetido por período (lista)
- `src/app/(dashboard)/cases/page.tsx` — repetido por linha (lista, 2 ocorrências no arquivo)
- `src/app/(dashboard)/clients/list/page.tsx` — repetido por linha (lista, 2 ocorrências no arquivo)

## Objetivo

Dar uma pista visual de que o botão `⋯` abre um menu com ações, sem reintroduzir a poluição visual que
motivou escondê-las, e sem repetir a mesma dica de primeira visita em cada linha de uma lista.

## Solução

Toda a mudança fica concentrada em `ActionsDropdown.tsx`, reaproveitando dois componentes que já existem
no projeto:

- `src/components/ui/Tooltip.tsx` — tooltip simples de hover/focus.
- `src/components/onboarding/ContextualTooltip.tsx` — coachmark exibido uma única vez por usuário,
  controlado por `localStorage` (`tooltip_dismissed_<storageKey>`), com botão de fechar.

### Nova prop

```ts
interface ActionsDropdownProps {
  actions: ActionItem[]
  ariaLabel?: string
  showFirstVisitHint?: boolean // default: false
}
```

`showFirstVisitHint` indica se **esta instância específica** pode exibir o coachmark de primeira visita.

### Lógica de exibição

Dentro do componente, na montagem, lê-se o mesmo `localStorage` key que o `ContextualTooltip` usa
internamente (chave global `actions_menu`, ou seja `tooltip_dismissed_actions_menu`):

- Se a dica **ainda não foi dispensada** e `showFirstVisitHint === true` → envolve o botão trigger com
  `ContextualTooltip` (`storageKey="actions_menu"`, texto: "Toque aqui para ver mais ações", `position`
  ajustada conforme o layout de cada tela para não estourar a viewport).
- Caso contrário (dica já dispensada, ou `showFirstVisitHint === false`) → envolve o botão trigger com
  `Tooltip` simples (texto: "Mais ações", hover/focus).

As duas bolhas nunca competem: o coachmark só aparece uma vez globalmente (mesma chave em todas as 6
telas — dispensar em qualquer lugar marca como visto em todo o app, pois é sempre o mesmo padrão visual),
e assim que é dispensado (ou em qualquer instância que não seja a "primeira"), cai para o tooltip de hover.

### Aplicação por tela

| Arquivo | Uso | `showFirstVisitHint` |
|---|---|---|
| `CaseInfoCard.tsx` | único | sempre `true` |
| `calculator/page.tsx` | único | sempre `true` |
| `deadlines/page.tsx` | único | sempre `true` |
| `PeriodItem.tsx` | lista | `true` apenas no primeiro item renderizado |
| `cases/page.tsx` | lista (2 ocorrências) | `true` apenas na primeira linha de cada lista renderizada |
| `clients/list/page.tsx` | lista (2 ocorrências) | `true` apenas na primeira linha de cada lista renderizada |

Em componentes de lista que já iteram com `.map((item, index) => ...)`, isso é `showFirstVisitHint={index === 0}`.
Onde não há índice disponível ainda, adicionar o índice do `.map` existente.

## Fora de escopo

- Não altera o conteúdo/itens dos menus de ação em cada tela.
- Não cria nenhum componente novo — só reaproveita `Tooltip` e `ContextualTooltip`.
- Não persiste preferência no backend — usa o mesmo mecanismo local (`localStorage`) já usado pelo
  onboarding existente.

## Testes / validação

- Hover/focus no botão sem dica dispensada ainda: mostra tooltip simples nas linhas 2+ de uma lista.
- Primeira visita: coachmark aparece só na primeira linha de cada lista e nas telas de instância única.
- Dispensar o coachmark em qualquer tela faz com que ele não apareça mais em nenhuma das 6 telas
  (mesma `localStorage` key).
- `aria-label` e navegação por teclado do `ActionsDropdown` permanecem inalterados.
