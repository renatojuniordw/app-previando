# Mapped Business Rules

> Gerado para cobertura 100% dos módulos em `src/store/`, `src/lib/`, `src/services/`

---

## Fase 1 — Zero-Coverage Modules

---

### MODULE: `store/admin-sidebar.ts`

#### Expected Behavior
**Input → Output/Side-Effect:**
- When `open()` is called, `isOpen` should be `true`
- When `close()` is called, `isOpen` should be `false`
- When `toggle()` is called, `isOpen` should invert (true→false, false→true)

#### Validations and Rules
1. Initial state: `isOpen` starts as `false`
2. `open()` sets `isOpen` to `true` regardless of current state
3. `close()` sets `isOpen` to `false` regardless of current state
4. `toggle()` flips `isOpen` value

#### Mapped Edge Cases
- **Double open**: calling `open()` twice keeps `isOpen = true`
- **Double close**: calling `close()` twice keeps `isOpen = false`
- **Toggle from true**: `isOpen` true → `toggle()` → `isOpen` false
- **Toggle from false**: `isOpen` false → `toggle()` → `isOpen` true

#### Expected Error Scenarios
- None (pure Zustand store, no error conditions)

#### Critical Dependencies
- None (pure in-memory state, no I/O)

#### ⚠️ Assumptions
- **ASSUMPTION 1**: Store follows same pattern as `sidebar.ts`, `toast.ts`, `upgrade-modal.ts` — no middleware, no persistence, no side effects.

---

### MODULE: `store/recent-store.ts`

#### Expected Behavior
**Input → Output/Side-Effect:**
- When `add({ type, id, label, href })` is called, item is prepended to `items` with `visitedAt` timestamp
- When `clear()` is called, `items` becomes empty `[]` and `localStorage` is cleared
- Maximum 5 items stored; overflowing items are dropped from end

#### Validations and Rules
1. **MAX_ITEMS = 5**: `items` array never exceeds 5 elements
2. **Deduplication**: adding an item with same `id` as existing item removes the old one first
3. **Order**: newest item is always at index 0 (prepended)
4. **Persist on add**: on `add()`, items are saved to `localStorage` under key `sidebar-recents`
5. **Load on init**: on store creation, items are loaded from `localStorage`. If `localStorage` is empty/parse fails, `items` starts as `[]`
6. **Clear persistence**: `clear()` saves empty array to `localStorage` and resets state
7. **SSR safety**: `load()` and `save()` guard against `typeof window === 'undefined'` (SSR), returning `[]` or doing nothing respectively
8. **Timestamp**: each `add()` sets `visitedAt` to the current ISO string timestamp

#### Mapped Edge Cases
- **Empty localStorage**: returns `[]`
- **Corrupted localStorage** (invalid JSON): `catch` returns `[]`
- **SSR/server-side**: `window undefined` → `load()` returns `[]`, `save()` no-ops
- **Duplicates**: adding same `id` twice replaces old entry; only one entry per `id` in list
- **Overflow**: adding 6th item drops the 5th → 5 items remain
- **Clear then add**: cleared state → add item → 1 item present
- **Add after clear preserves max**: add 6 items → clear → add 2 → 2 items

#### Expected Error Scenarios
- None (errors caught silently in `load()` for JSON parse failures)

#### Critical Dependencies
- Depends on `localStorage` API (browser only). On SSR, gracefully degrades (empty list, no-ops).

#### ⚠️ Assumptions
- **ASSUMPTION 1**: `localStorage` is always available when `window !== undefined` (standard browser assumption)
- **ASSUMPTION 2**: `new Date().toISOString()` generates a valid ISO string — no custom formatting

---

### MODULE: `store/search-store.ts`

#### Expected Behavior
**Input → Output/Side-Effect:**
- When `openSearch()` is called, `open` becomes `true`
- When `close()` is called, `open` becomes `false`
- When `toggle()` is called, `open` inverts

#### Validations and Rules
1. Initial state: `open` starts as `false`
2. `openSearch()` sets `open` to `true`
3. `close()` sets `open` to `false`
4. `toggle()` flips `open` value

#### Mapped Edge Cases
- **Double open**: calling `openSearch()` twice keeps `open = true`
- **Double close**: calling `close()` twice keeps `open = false`
- **Toggle from true**: `open` true → `toggle()` → `open` false
- **Toggle from false**: `open` false → `toggle()` → `open` true

#### Expected Error Scenarios
- None

#### Critical Dependencies
- None

---

### MODULE: `lib/prompts/portal/faq.ts`

#### Expected Behavior
**Input → Output/Side-Effect:**
- `buildFaqUserPrompt(params)` returns a string built from `params` fields
- `PORTAL_FAQ_SYSTEM_PROMPT` is a constant string

#### Validations and Rules
1. `buildFaqUserPrompt` string includes `params.benefitType` in output
2. `buildFaqUserPrompt` string includes `params.modalityLabel` if provided, else "Não informada"
3. `buildFaqUserPrompt` string includes `params.clientAge` formatted as `${age} anos` if provided, else "Não informada"
4. `buildFaqUserPrompt` string includes `params.eligible` mapped to "Sim" (true) or "Não" (false)
5. `buildFaqUserPrompt` string includes `params.rmi` formatted as `R$ X.XX` if provided, else "A calcular"
6. `PORTAL_FAQ_SYSTEM_PROMPT` is a non-empty string containing "FAQ"

#### Mapped Edge Cases
- **modalityLabel undefined/null**: outputs "Não informada"
- **clientAge undefined/null**: outputs "Não informada" anos
- **eligible false**: outputs "Não"
- **rmi undefined/null**: outputs "A calcular"
- **rmi zero**: outputs "R$ 0.00"
- **rmi large number**: formats correctly with `toFixed(2)` (e.g., 12345.6 → "R$ 12345.60")

#### Expected Error Scenarios
- None (pure string construction, no error paths)

#### Critical Dependencies
- None

---

## Fase 2 — Low-Coverage Business Modules

---

### MODULE: `lib/bpc-notes.ts`

#### Expected Behavior
**Input → Output/Side-Effect:**
- `formatRelatoSocialText(relato)` returns formatted string with header, domain sections, Q&A pairs, and summary count
- `saveBpcToNotes(caseId, userId, tipo, content)` creates a `CaseNote` in Prisma with versioning

#### Validations and Rules
1. `formatRelatoSocialText`: header is always "RELATO DE AVALIAÇÃO SOCIAL — ENTREVISTA COM CLIENTE"
2. `formatRelatoSocialText`: only items with non-empty trimmed `resposta` are included per domain
3. `formatRelatoSocialText`: domains with zero answered items are skipped entirely
4. `formatRelatoSocialText`: summary shows `[X de Y perguntas respondidas]`
5. `saveBpcToNotes`: queries last note version by `caseId` (descending)
6. `saveBpcToNotes`: content is prefixed with `[BPC/LOAS — ${LABELS[tipo] ?? tipo}]\n\n`
7. `saveBpcToNotes`: version = (lastNote.version ?? 0) + 1
8. `saveBpcToNotes`: type is always `NoteType.BPC_ANALYSIS`
9. `saveBpcToNotes`: on prisma error, logs to console.error and does NOT throw (swallows error)

#### Mapped Edge Cases
- **Unknown tipo**: uses raw `tipo` string instead of LABELS mapping (e.g., "unknown_type")
- **No prior notes**: version starts at 1 (0 + 1)
- **Prior notes exist**: version increments from last note's version
- **Prisma failure**: caught by `.catch()`, error logged, function returns void without throwing

#### Expected Error Scenarios
- When Prisma create fails, error is caught and logged, no exception propagates

#### Critical Dependencies
- Depends on `prisma.caseNote.findFirst` and `prisma.caseNote.create`
- Uses `@/lib/prisma` which is auto-mocked in vitest setup

---

### MODULE: `lib/pdf-generator.ts`

#### Expected Behavior
**Input → Output/Side-Effect:**
- `maskCPF(cpf)` returns masked CPF with format `XXX.XXX.XXX-XX` or original if invalid
- `generateCasePDF(data)` returns a Buffer containing a valid PDF
- `generateBpcPDF(data)` returns a Buffer containing a valid PDF
- `generateBpcConsolidatedPDF(data)` returns a Buffer containing a valid PDF
- `renderFormattedMarkdown(doc, text, y)` renders markdown text onto the PDF doc
- `collectBuffer(doc)` rejects with timeout error after 30s if doc doesn't end

#### Validations and Rules
1. `maskCPF`: removes non-digits, if 11 digits, returns masked `XXX.XXX.XXX-XX` format
2. `maskCPF`: if input doesn't have 11 digits after cleaning, returns original unchanged
3. `maskCPF`: returns original for empty string, short strings (<11), long strings (>11)
4. `generateCasePDF`: always includes client data section (Nome, CPF, Nascimento, Estado Civil)
5. `generateCasePDF`: optional fields (deathDate, profession, phone, email, address) only rendered when truthy
6. `generateCasePDF`: CNIS summary section rendered only when `data.cnisSummary` is truthy
7. `generateCasePDF`: calculation section rendered only when `data.selectedCalculation` is truthy
8. `generateCasePDF`: opinion section rendered when `data.opinion` is truthy; otherwise simple footer
9. `generateCasePDF`: AI disclaimer page added when opinion OR calculation exist
10. `generateCasePDF`: watermark applied to all pages when `data.watermark` is true
11. `generateBpcPDF`: client info rendered when `data.clientInfo` is truthy
12. `generateBpcPDF`: generatedAt rendered when `data.generatedAt` is truthy
13. `generateBpcConsolidatedPDF`: sections loop renders each section with headers
14. `collectBuffer`: rejects with timeout after 30,000ms if no 'end' event

#### Mapped Edge Cases
- **maskCPF**: null/empty → returns ""
- **maskCPF**: "123" → returns "123" (unchanged, < 11 digits)
- **maskCPF**: "123456789012" → returns "123456789012" (unchanged, > 11 digits)
- **maskCPF**: "111.444.777-35" → returns "XXX.444.777-35"
- **markdown headings**: h1 → bold 14pt dark; h2 → bold 11pt accent with underline; h3 → bold 10pt dark
- **markdown bullets**: lines starting with "• " or "- " render with bullet symbol at indent
- **markdown HR**: lines with 3+ dashes render horizontal line
- **markdown bold/italic**: `**text**` and `_text_` stripped of formatting markers
- **Page overflow**: when y > PAGE_MAX_Y (760), draws footer, adds page, resets y to 60
- **collectBuffer timeout**: if doc doesn't end within 30s, rejects with Error

#### Expected Error Scenarios
- When `collectBuffer` timeout fires (30s), rejects with `Error('PDF generation timed out after 30s')`
- When PDFDocument emits error, `collectBuffer` rejects with that error

#### Critical Dependencies
- Depends on `pdfkit` (PDFDocument) — a Node.js library for PDF generation
- Buffers collected via stream `data` events

---

### MODULE: `services/cnis/programmatic-parser.ts`

#### Expected Behavior
**Input → Output/Side-Effect:**
- `parseCnisProgrammatically(pdfText)` returns `{ markdown: string, extractedData: CnisExtractedData }` or `null`

#### Validations and Rules
1. Returns `null` for empty/whitespace-only input
2. Returns `null` if NIT is not found (no valid 11-digit NIT/PIS/PASEP in text)
3. Returns `null` if Nome is not found (no valid 2+ word name in text)
4. Returns `null` if no valid salary entries found (allSalaries.length === 0)
5. NIT: extracted from single-line `NIT: 123.45678.90-1` or from `PIS/PASEP:`, `Inscrição:`, `PIS:` labels
6. NIT: also extracted from 2-line layout — line is just "NIT:" and next line contains the number
7. NIT: formatted as `XXX.XXXXX.XX-X` (11 digits)
8. Nome: extracted from `Nome: João Silva` single line or `Nome:` line with name on next line
9. Nome: must have ≥2 words and not contain "SEGURADO" or "CNIS"
10. Birth date: extracted from `Data de Nascimento: DD/MM/AAAA` or from separate line after label
11. Birth date: converted to `YYYY-MM-DD` format
12. Period detection: triggered by Seq, CNPJ/CEI/CPF, or Relação Previdenciária lines
13. Periods with "BENEFICIO"/"BENEFÍCIO" or `B\d{2}` pattern marked as isBeneficio (excluded from output)
14. BLOQ-EC103 / PREM-FVIN / PREM-BLOQ-EC103 salaries filtered out (excluded from period)
15. Salaries: extracted from single-line format `MM/YYYY VALUE` and multi-line format (competência line, then valor line, then optional indicators)
16. Salary values: parsed removing `.` thousands separator, `,` as decimal separator
17. Gaps: detected between consecutive salaries within same period (missing months)
18. Period indicators: extracted from `Indicadores: ...` lines
19. Duplicate competência salaries: merged (values summed, indicators concatenated)
20. Period deduplication: same Seq/CNPJ matched to existing period if no salaries yet

#### Mapped Edge Cases
- **Text with only whitespace**: returns null
- **NIT multi-line format**: "NIT:\n123.45678.90-1" → extracts correctly
- **Nome multi-line format**: "Nome:\nJoão Silva" → extracts correctly
- **Birth date multi-line**: "Data de Nascimento:\n15/05/1990" → extracts correctly
- **Invalid NIT length**: 10 or 12 digit numbers rejected, only 11 digits accepted
- **Nome with single word**: rejected, need ≥2 words
- **BENEFICIO period**: detected as isBeneficio via "BENEFICIO", "BENEFÍCIO", or B\d{2} pattern
- **BPC indicator exception**: if line contains "Indicadores:" along with "BENEFICIO", NOT marked as isBeneficio
- **BLOQ salaries**: entire salary entry skipped if BLOQ-EC103/PREM-FVIN/PREM-BLOQ-EC103 present
- **NaN parsed value**: if parseFloat returns NaN, salary entry is skipped
- **Duplicate competência**: salaries for same competência are merged (summed)
- **Empty periods after filter**: if all salaries are BLOQ or NaN, period has no salaries → may cause allSalaries.length === 0 → return null
- **Seq without number**: "Seq." line followed by number in next 5 lines
- **No valid periods**: return null when allSalaries is empty

#### Expected Error Scenarios
- Invalid input → null (no thrown exceptions)
- Nonexistent NIT → null
- Nonexistent Nome → null
- No valid salary entries → null

#### Critical Dependencies
- None (pure function, no I/O)


---

## Fase 3 — Below-Threshold Modules

*(to be filled)*

---

## Fase 4 — Branch Gap Modules

*(to be filled)*

---

## Fase 5 — Strategy Branch Gaps

*(to be filled)*

---

## Fase 6 — Prompt Branch Gaps

*(to be filled)*
