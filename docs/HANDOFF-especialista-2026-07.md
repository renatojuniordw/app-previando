# Handoff — Ajustes indicados pela especialista previdenciária (2026-07)

> **Início:** 2026-07-05
> **Contexto:** 5 mudanças levantadas em sessão de revisão com especialista previdenciária. Este arquivo é atualizado após CADA item concluído — se a conversa for interrompida, retome lendo este arquivo e o estado do código (git diff / git log).

## Ordem de execução e status

| # | Item | Status |
|---|---|---|
| 1 | Percentual de honorários na Liquidação de Retroativos (reaproveitando model `Fee`) | ✅ concluído |
| 2 | Painel global de honorários (`/api/fees`, `/honorarios`) | ✅ concluído |
| 3 | Remover as 3 teses específicas de Revisão de Benefícios (STF), manter genérico | ✅ concluído |
| 4 | Adicionar modalidade Aposentadoria PCD (LC 142/2013) | ✅ concluído |
| 5 | Migrar CNIS de `Case` para `Client` (1 CNIS por segurado), incluindo UI de gestão no cadastro do cliente | ✅ concluído |

Legenda: 🔲 pendente · 🟡 em andamento · ✅ concluído · ⚠️ bloqueado/decisão pendente

**Status geral: todos os 5 itens implementados e verificados em 2026-07-06.**
Verificação final: `npx prisma validate` ✅ · `npx prisma migrate diff` (schema local vs. banco) → vazio, sincronizado ✅ · `npx vitest run` → **504/504 testes passando** (42 arquivos) ✅ · `npx tsc --noEmit` → 11 erros, todos pré-existentes (não relacionados a estas mudanças) ✅.

### Item 5 (complemento) — UI de CNIS no cadastro do cliente ✅

O usuário perguntou por que a extração do CNIS não estava na tela `clients/list/[id]/page.tsx` — o card de upload/gestão foi implementado nesta mesma sessão, fechando o follow-up que tinha ficado pendente.

**Refatoração de reaproveitamento (evitar duplicar lógica entre a tela do cliente e a tela do caso):**
- `useCnis` e `useCnisUpload` eram hooks privados de `src/app/(dashboard)/cases/[id]/cnis/_hooks/` — movidos para `src/hooks/useCnis.ts` e `src/hooks/useCnisUpload.ts` (localização compartilhada já usada por outros hooks do projeto), já que agora são consumidos por duas telas diferentes.
- Tipos (`CnisData`, `CnisExtractedData`, `Periodo`, `PeriodWarning`) movidos de `.../cnis/_types.ts` para `src/types/cnis.ts`.
- Constantes (`STATUS_CONFIG`, `isProcessingStatus`) movidas de `.../cnis/_constants.ts` para `src/lib/cnis-status.ts`.
- Todos os imports dentro de `cases/[id]/cnis/` (page.tsx, `_hooks/useCnisEditing.ts`, `_components/CnisStatusCard.tsx`, `_components/CnisExtractedData.tsx`, `_components/PeriodItem.tsx`, `_utils.ts`) atualizados para os novos caminhos; arquivos antigos (`_types.ts`, `_constants.ts`, `_hooks/useCnis.ts`, `_hooks/useCnisUpload.ts`) deletados (sem shim de compatibilidade).
- `useCnisEditing.ts` (edição detalhada campo a campo do CNIS) permaneceu privado da tela de caso — é específico daquele fluxo de revisão manual, não fazia sentido mover.

**Novo componente:** `src/components/client/ClientCnisCard.tsx` — card compacto (upload/substituir/reprocessar/excluir/baixar), usando os hooks compartilhados com `clientId`. Inserido em `clients/list/[id]/page.tsx` entre "Dados do Segurado" e "Resumo de Casos". O diálogo de exclusão avisa explicitamente quando o cliente tem mais de 1 caso, deixando claro que excluir ali apaga cálculos/simulações/retroativos de todos os processos que dependem daquele CNIS.

**Verificação:** `npx tsc --noEmit` sem erros novos; `npx vitest run` → 504/504 passando (nenhum teste unitário cobria os hooks mudados de lugar, então a migração de arquivos não exigiu mudança de testes).

### Pendências / follow-ups para a próxima sessão
1. **Migration de dados do CNIS em produção**: antes de rodar `20260706040000_cnis_case_to_client` em produção, verificar manualmente se existem clientes com múltiplos CNIS cadastrados em casos diferentes — a migration mantém só o mais recente e descarta os demais (arquivos R2 órfãos não são apagados automaticamente).
2. **Teste manual em navegador**: nenhuma das telas alteradas foi testada visualmente (ambiente non-interactive) — recomenda-se validar ao vivo: liquidação de retroativos com percentual, painel `/honorarios`, formulário de revisão simplificado, calculator com nova modalidade PCD, e o novo card de CNIS na tela do cliente (upload, substituir, reprocessar, excluir).
3. Considerar, no futuro, remover o badge de CNIS por caso em `clients/list/[id]/page.tsx` (linha ~307) já que agora é redundante com o novo card único — mantido por ora para não alterar comportamento existente sem pedido explícito.

---

## Notas de arquitetura (já validadas por investigação, não repetir)

- **Fee ↔ Retroactive**: hoje desconectados. Plano: `Fee.retroactiveId` opcional + criar `Fee` (`type: PERCENTAGE`) na mesma transação do `RetroativoOrchestrator.run()`.
- **Fees globais**: reaproveitar a agregação já existente em `src/app/api/reports/financeiro/route.ts` (não recriar lógica).
- **Revisão de Benefícios**: `BenefitType.BENEFIT_REVIEW` (genérico) já existe e NÃO muda. Só o enum interno `RevisionType` (`REVISAO_VIDA_TODA`, `REVISAO_ART_29`, `REVISAO_BURACO_NEGRO`) e a lógica em `revision-engine.ts`/`revision.ts` serão consolidados numa única estratégia genérica. Decisão do usuário: **remover completamente as 3 teses**, sem manter nada internamente.
- **PCD**: coeficiente FIXO 100% (não reaproveitar `getCoeficienteProgressivo`). Duas vias de elegibilidade (tempo por grau OU idade+15 anos). Precisa de `Client.disabilityDegree` novo e extensão de `RetirementRule`.
- **CNIS**: migrar FK de `CnisDocument.caseId` para `CnisDocument.clientId @unique`. Worker BullMQ já é agnóstico (usa `cnisDocumentId`), não precisa mudar lógica central. ~15-18 arquivos, incluindo migração de dados de produção (deduplicar CNIS quando cliente já tem múltiplos casos com CNIS diferentes).

---

## Log de execução

### Item 1 — Percentual de honorários em Retroativos ✅

**O que foi feito:**
- `prisma/schema.prisma`: `Retroactive` ganhou `feePercentage Decimal? @db.Decimal(5,2)`, `feeValue Decimal? @db.Decimal(12,2)`, `clientNetValue Decimal? @db.Decimal(12,2)` + relação inversa `fee Fee?`. `Fee` ganhou `retroactiveId String? @unique` + relação `retroactive Retroactive?` (onDelete: SetNull).
- Migration criada manualmente (ambiente non-interactive não permite `migrate dev`): `prisma/migrations/20260706010000_add_fee_percentage_and_fee_link/migration.sql`, gerada via `prisma migrate diff --from-schema-datasource --to-schema-datamodel --script` e aplicada com `prisma migrate deploy`. **Já aplicada no banco local.**
- `src/lib/retroativos-engine.ts`: `RetroativoInput.percentualHonorarios?`, calcula `valorHonorarios`/`valorLiquidoCliente` sobre o `valorLiquidoFinal`; valida range 0-100 (lança erro fora do intervalo).
- `src/services/previdencia/retroativo-orchestrator.ts`: `RunRetroativoInput.percentualHonorarios?`; `run()` agora usa `prisma.$transaction` para criar `Retroactive` + (se percentual informado) `Fee` vinculado (`type: 'PERCENTAGE'`, `retroactiveId`).
- `src/services/previdencia-service.ts`: não precisou mudar (passthrough de `RunRetroativoInput`).
- `src/app/api/cases/[id]/retroativos/route.ts`: `createSchema` aceita `percentualHonorarios` (zod, 0-100), repassado ao service.
- `src/app/(dashboard)/cases/[id]/retroativos/_hooks/useRetroativos.ts`: novo state `percentualHonorarios`/`setPercentualHonorarios`, validação client-side, mapping de `feePercentage`/`feeValue`/`clientNetValue` da resposta da API.
- `src/app/(dashboard)/cases/[id]/retroativos/page.tsx`: novo input de percentual no modal; nova seção de KPIs (Honorários Advocatícios / Valor Líquido do Cliente) exibida quando `percentualHonorarios` está presente; `KpiCell` ganhou highlight `indigo`.
- `tests/unit/retroativos-engine.test.ts`: +2 testes (cálculo correto do split, erro para percentual fora de 0-100).

**Verificação:** `npx vitest run tests/unit/retroativos-engine.test.ts` → 8/8 passando. `npx tsc --noEmit` sem erros novos nos arquivos tocados. Migration aplicada e `prisma generate` rodado.

**Não foi feito** (fora do escopo pedido): não criei UI para editar o `Fee` criado automaticamente — ele aparece na tela de honorários do caso existente (`/cases/[id]/honorarios`) normalmente, já que é um `Fee` como outro qualquer.

### Item 2 — Painel global de honorários ✅

**O que foi feito:**
- `src/app/api/fees/route.ts` (novo): `GET` retornando todos os `Fee` do advogado logado (`case: { userId }`), com filtros `status`, `search` (nome do cliente, via `case.client.name` contains insensitive), `from`/`to` (por `createdAt`). Retorna `summary { total, paid, pending, collectionRate }` — reaproveita a mesma lógica de soma já usada em `cases/[id]/fees/route.ts` e no relatório financeiro, sem duplicar cálculo novo. Auth via `@/auth` (mesmo padrão da rota de fees por caso).
- `src/app/(dashboard)/honorarios/page.tsx` (novo): painel com cards de resumo (total esperado, recebido, pendente, taxa de cobrança), filtros (status, busca por cliente com debounce de 300ms, período), tabela com cliente/caso/descrição/valor/status, e drill-down (clique na linha navega para `/cases/{caseId}/honorarios`).
- `src/components/Sidebar.tsx`: novo item "Honorários" na seção "Acompanhamento" (ícone `DollarSign`, já importado antes, reaproveitado).

**Verificação:** `npx tsc --noEmit` sem erros novos nos arquivos criados/tocados (todos os erros remanescentes são pré-existentes em arquivos de teste não relacionados). Não rodei o servidor dev para clicar na tela (ambiente non-interactive) — recomenda-se validar visualmente antes de considerar 100% pronto para produção.

**Decisão de escopo:** não criei `src/app/api/fees/[feeId]/route.ts` (PUT/DELETE fora do escopo de caso) — o painel global é somente leitura com drill-down para a tela de edição já existente por caso, que já cobre CRUD completo. Se a especialista quiser editar honorários direto do painel global sem abrir o caso, isso pode ser adicionado depois.

### Item 3 — Remover teses específicas de Revisão de Benefícios ✅

**Decisão confirmada com o usuário:** remover completamente as 3 teses (Vida Toda/Tema 1.102 STF, Art. 29/Tema 999 STJ, Buraco Negro/EC 103/2019), sem manter nada internamente — só a revisão genérica `REVISAO_BENEFICIO` (que já existia em `BenefitType`, não mudou).

**O que foi feito:**
- `src/lib/strategies/revision-types.ts`: `RevisionType` reduzido a `'REVISAO_BENEFICIO'`; `REVISION_LABELS`/`REVISION_DESCRIPTIONS` com uma entrada só.
- `src/lib/strategies/revision.ts`: as 3 classes (`RevisaoVidaTodaStrategy`, `RevisaoArtigo29Strategy`, `RevisaoBuracoNegroStrategy`) substituídas por uma única `RevisaoBeneficioStrategy` (mesma fórmula de coeficiente genérica 0.6 + progressão, sem validação de carência específica).
- `src/lib/strategies/registry.ts`: registro único `['REVISAO_BENEFICIO', new RevisaoBeneficioStrategy()]`.
- `src/lib/revision-engine.ts`: removido o `switch` por tese, `clonarCnisComPre94`, `extractContribuicoesPre94` e as validações específicas (carência 180, corte temporal EC 103). `calcularRevisao` agora só valida se o CNIS foi processado e roda `calculatePrevidenciario` com modalidade `REVISAO_BENEFICIO` diretamente.
- `src/app/api/cases/[id]/revisions/route.ts`: `z.enum(['REVISAO_BENEFICIO'])`.
- `src/app/(dashboard)/cases/[id]/revisao/page.tsx`: removido o grid de 3 cards de seleção de tese; `tipoRevisao` agora é uma constante fixa enviada automaticamente; textos de apoio atualizados.
- Testes reescritos: `strategies-revision.test.ts`, `strategies-registry.test.ts`, `revision-engine.test.ts`, `strategies-revision-types.test.ts` (16 testes, todos passando).
- Migração de dados: `prisma/migrations/20260706020000_consolidate_revision_types/migration.sql` — `UPDATE revisions SET tipoRevisao = 'REVISAO_BENEFICIO' WHERE tipoRevisao IN (...)`. Não houve mudança de schema (coluna já era `TEXT` livre). **Aplicada no banco local.**

**Verificação:** `npx vitest run` nos 4 arquivos de teste → 16/16 passando. `grep` confirma zero referências restantes a `REVISAO_VIDA_TODA`/`REVISAO_ART_29`/`REVISAO_BURACO_NEGRO` em `src/` e `tests/`. `npx tsc --noEmit` sem erros novos.

### Item 4 — Aposentadoria PCD (LC 142/2013) ✅

**Decisão de arquitetura tomada nesta implementação (não estava no relatório original):** o grau de deficiência (`disabilityDegree: 'LEVE'|'MODERADO'|'GRAVE'`) foi implementado como **parâmetro de entrada do cálculo** (igual a `tempoEspecialAnos` para Aposentadoria Especial e `dependentesPensao` para Pensão por Morte), e **não** como campo persistido em `Client`. Isso seguiu o padrão já existente no código: mesmo `gender` — que é um atributo real do segurado — já é digitado manualmente a cada cálculo em vez de vir do cadastro do cliente. Evitou uma migração de schema em `Client` e manteve consistência com o resto do módulo de cálculo.

**O que foi feito:**
- `prisma/schema.prisma`: `BenefitType` ganhou `PCD_RETIREMENT`; `CalculationModality` ganhou `PCD`. Migration `prisma/migrations/20260706030000_add_pcd_retirement/migration.sql` (`ALTER TYPE ... ADD VALUE`). **Aplicada no banco local.**
- `src/lib/strategies/types.ts`: `ModalidadeEvaluationInput` ganhou `disabilityDegree?: 'LEVE'|'MODERADO'|'GRAVE'`.
- `src/lib/strategies/retirement.ts`: nova `AposentadoriaPCDStrategy` — coeficiente **fixo em 1.0** (100% da média, sem fator previdenciário nem 86/96 progressivo, diferente das demais strategies). Elegibilidade por **duas vias**: (a) idade 60H/55M + 15 anos de contribuição, independente do grau; (b) tempo de contribuição por grau (`GRAVE`: 25H/20M, `MODERADO`: 29H/24M, `LEVE`: 33H/28M — tabela `TEMPO_CONTRIBUICAO_PCD_POR_GRAU` hardcoded na strategy, já que são valores estatutários da LC 142/2013).
- `src/lib/strategies/registry.ts`: registrada `['APOSENTADORIA_PCD', new AposentadoriaPCDStrategy()]` — motor genérico (`previdencia-engine.ts`) não precisou de nenhuma mudança de lógica (OCP respeitado), só thread do novo campo `disabilityDegree` pelo pipeline.
- `src/lib/previdencia-engine.ts`, `src/services/previdencia/calculation-orchestrator.ts`, `src/app/api/cases/[id]/calculations/schema.ts` + `route.ts`: `disabilityDegree` passado ponta a ponta (input → engine → strategy → persistido em `Calculation.inputParams` JSON).
- `src/lib/mappers.ts`: `APOSENTADORIA_PCD` ↔ `CalculationModality.PCD` / `DbBenefitType.PCD_RETIREMENT`, incluindo `BENEFIT_TO_MODALITIES`.
- `src/lib/modalidade-labels.ts`, `src/lib/constants.ts`: labels em PT-BR adicionados (`MODALIDADES_PADRAO`, `CODE_MAP`, `BENEFIT_LABELS`, `BENEFIT_SHORT_LABELS`, `BENEFIT_DB_LABELS`).
- `src/app/(dashboard)/cases/[id]/calculator/_hooks/useCalculator.ts` + `page.tsx`: novo `<select>` condicional (grau de deficiência) exibido quando `modalidade === 'APOSENTADORIA_PCD'`, seguindo o mesmo padrão visual dos campos condicionais existentes (tempo especial, dependentes).
- Testes: 8 novos casos em `tests/unit/strategies-retirement.test.ts` (coeficiente fixo, elegibilidade por grau — grave/leve, elegibilidade por idade, carência insuficiente, grau ausente); `tests/unit/strategies-registry.test.ts` não precisou de mudança adicional (já testa genericamente todas as modalidades registradas).
- `tests/unit/constants.test.ts`: contagem fixa de benefícios atualizada de 12 → 13.

**Decisão de escopo — não alterado:**
- `src/app/api/cases/[id]/suggest-modalities/route.ts` (`ALL_MODALITIES`) e `compare/page.tsx`/`ComparePDFDocument.tsx` (`MODALITY_LABELS`) **não** ganharam PCD: essa rota sugere automaticamente todas as modalidades elegíveis rodando o motor para M e F, mas não tem de onde obter o grau de deficiência do segurado — sugerir PCD sem esse dado geraria falsos negativos/positivos. Se a especialista quiser isso automatizado, será necessário decidir onde capturar o grau de deficiência de forma persistente (ex.: no cadastro do cliente) primeiro.
- Não foi criado campo persistido de deficiência em `Client` (ver decisão de arquitetura acima).

**Verificação:** `npx vitest run` completo → **504/504 testes passando** (41→42 arquivos). `npx tsc --noEmit` sem erros novos (mesma lista pré-existente de 14 erros em arquivos de teste não relacionados). Migration aplicada e `prisma generate` rodado.

### Item 5 — CNIS: Case → Client ✅ (backend completo)

**Schema:** `CnisDocument.caseId @unique` → `CnisDocument.clientId @unique`, relação movida para `Client.cnisDocument`. Migration manual `prisma/migrations/20260706040000_cnis_case_to_client/migration.sql` (não gerada por diff automático porque envolve backfill + deduplicação de dados):
1. Adiciona `clientId` nullable.
2. Backfill via `UPDATE ... FROM cases`.
3. **Deduplicação**: mantém só o CNIS mais recente (`updatedAt DESC`) por cliente, descarta os demais. No banco local havia só 1 CNIS/0 conflitos, então rodou sem perda visível — **mas o comentário no topo do arquivo SQL avisa explicitamente que em produção isso pode descartar documentos** (e os arquivos R2 correspondentes não são apagados automaticamente) — recomendo checar duplicados manualmente antes de rodar em produção.
4. Torna `clientId` obrigatório + único, cria FK nova, remove FK/índice/coluna antigos (`caseId`).
Aplicada e confirmada com `prisma migrate diff` retornando "empty migration" (schema e banco sincronizados).

**Decisão de arquitetura que reduziu bastante o escopo real:** em vez de reescrever os ~11 arquivos que faziam `include: { cnisDocument }` diretamente em queries de `Case` para embutir toda a lógica de navegação por `Client` no frontend, o backend continua expondo `case.cnisDocument` nas respostas de API exatamente como antes (agora resolvido via `client.cnisDocument` internamente e "achatado" de volta no JSON de resposta). Isso significa que **nenhuma tela que só lê `cnisDocument` precisou mudar**: `CaseInfoCard.tsx`, `CnisInfoCard.tsx`, `clients/list/[id]/page.tsx` (badge por caso), `calculator`/`simulator` (via `case.cnisDocument`, chamada dedicada a `/cnis/${caseId}` removida e substituída por reaproveitar o dado já embutido em `/cases/{id}`).

**Arquivos alterados:**
- **Schema**: `prisma/schema.prisma` (`Client.cnisDocument`, `Case` perde `cnisDocument`, `CnisDocument.clientId`).
- **4 rotas de API do CNIS** (movidas de `[caseId]` para `[clientId]`): `src/app/api/cnis/upload/route.ts` (recebe `clientId` no FormData em vez de `caseId`; cascade delete de dados calculados agora filtra por `case: { clientId }`), `src/app/api/cnis/[clientId]/route.ts`, `.../status/route.ts`, `.../reprocess/route.ts` — todas usando `verifyClientOwnership` (já existia em `src/lib/ownership.ts`, reaproveitado sem duplicar).
- **Worker** `src/jobs/cnis-worker.ts`: simplificado — não busca mais `Case` para achar `userId` (o payload do job agora já traz `clientId` e `userId` diretamente, passados pelas rotas de upload/reprocess); notificações/auditoria deixaram de referenciar `caseId` (campo é opcional em `Notification`).
- **Services**: `src/services/previdencia/helpers.ts` (`findAndValidateCnis`, `resolveBirthDateForCalculation` — agora buscam CNIS via `client.cases.some.id`), `src/services/revision-service.ts`, `src/services/query-cnis.ts` (script de debug).
- **11 rotas de API que liam `cnisDocument` via `Case`**: `cases/route.ts`, `cases/[id]/route.ts`, `opinions`, `peticao`, `viability-score`, `simulations`, `suggest-modalities`, `success-analysis`, `timeline`, `export/data/route.ts`, `onboarding/progress/route.ts`, `clients/[id]/route.ts`, `portal/[token]/simulate/route.ts` — todos trocaram `include: { cnisDocument }` por `include: { client: { select: { cnisDocument: ... } } }`, e onde a resposta precisava manter o formato antigo (`case.cnisDocument`), o mapeamento faz o "achatamento" (`cnisDocument: caso.client.cnisDocument`).
- **Frontend**: `useCnis.ts`, `useCnisUpload.ts`, `useCnisEditing.ts` (parâmetro renomeado de `caseId` para `clientId`); `cases/[id]/cnis/page.tsx` agora resolve o `clientId` do caso atual (`GET /cases/{id}` → `case.client.id`) antes de inicializar os hooks; `useCalculator.ts` e `useSimulator.ts` pararam de chamar `/cnis/${caseId}` diretamente e passaram a reaproveitar `case.cnisDocument` já incluído na resposta de `/cases/{id}` (uma chamada HTTP a menos por carregamento de tela).

**Não incluído neste ciclo (follow-up recomendado):** a tela `src/app/(dashboard)/clients/list/[id]/page.tsx` — sugerida pelo usuário como local ideal para o upload de CNIS por cliente — continua sem uma UI de upload/gestão de CNIS própria; ela só exibe o badge de status por caso (que já funciona, pois a API `clients/[id]` já retorna `client.cnisDocument` e replica em cada caso). Adicionar upload/reprocessamento/exclusão diretamente nessa tela é uma tarefa de UI (não de dados) que ficou de fora por exigir desenho de componente e validação visual no navegador — o backend (`/api/cnis/[clientId]/*`) já está pronto para ser consumido por essa tela quando for implementada.

**Verificação:** `npx prisma migrate diff` confirma banco == schema. `npx vitest run` → 504/504 passando. `npx tsc --noEmit` sem erros novos (removido cache stale de `.next/types` da rota antiga `[caseId]`).

