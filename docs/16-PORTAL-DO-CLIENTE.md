# 16 — Portal do Cliente: Compartilhamento Seguro

> Configuração granular do que o cliente pode ver via link único
> Última atualização: 2026-07-15

---

## 1. Conceito

O Portal do Cliente permite que o advogado **compartilhe um link único** com o cliente para que ele acompanhe o andamento do caso. Diferente de um modelo "tudo ou nada", o advogado **controla exatamente quais informações estão visíveis** através do `portalConfig`.

---

## 2. Princípios de Segurança (LGPD)

| Princípio | Implementação |
|---|---|
| **Dados mínimos** | Só expõe o que o advogado explicitamente autorizou |
| **Token opaco** | Link usa `crypto.randomBytes(32).toString('base64url')` (256 bits) — não expõe IDs internos |
| **Expiração automática** | Link expira em 30 dias |
| **Revogação imediata** | `DELETE /api/cases/[id]/portal` invalida o link na hora |
| **Zero dados bancários** | CPF nunca é exposto (nem hash). Telefone e email nunca são expostos |
| **Verificação de identidade** | (planejado) CPF parcial + data de nascimento para módulos sensíveis |

---

## 3. PortalConfig

### 3.1 Estrutura

```typescript
interface PortalConfig {
  showProcessTracking: boolean  // Acompanhamento processual (número + movimentações)
  showCalculations: boolean     // Cálculos (RMI, RMA, modalidades)
  showRetroactives: boolean     // Retroativos (valores financeiros)
  showInterpretation: boolean   // Interpretação de movimentações com IA
  showTimeline?: boolean        // Timeline do caso (eventos e prazos)
  showFaq?: boolean             // FAQ customizada por caso
  showDocuments?: boolean       // Documentos compartilhados
  showGlossary?: boolean        // Glossário de termos previdenciários
}
```

### 3.2 Default

```json
{
  "showProcessTracking": true,
  "showCalculations": true,
  "showRetroactives": false,
  "showInterpretation": false,
  "showTimeline": false,
  "showFaq": false,
  "showDocuments": false,
  "showGlossary": false
}
```

Retroativos e interpretação começam **desligados por padrão** por serem dados mais sensíveis.

### 3.3 Onde fica armazenado

Campo `portalConfig` (JSON) no model `Case` — dentro da tabela `cases`. Isso significa que é:
- **Por caso**: cada caso pode ter uma config diferente
- **Sem migration extra**: campo JSON flexível, Prisma trata nativamente
- **Fácil de estender**: adicionar novas chaves não requer schema change

---

## 4. Arquitetura

```
[Advogado no caso]
  → PortalConfigCard (UI de toggles)
  → PATCH /api/cases/[id]/portal/config
  → Salva portalConfig no banco

[Advogado gera link]
  → POST /api/cases/[id]/portal
  → Cria ClientAccess com token + expiry 30 dias
  → Retorna link: app.previando.com.br/portal/{token}

[Cliente acessa]
  → GET /api/portal/[token]
  → Lê portalConfig do caso
  → Filtra dados: só retorna o que está autorizado
  → Cliente vê apenas os módulos liberados
```

---

## 5. Endpoints

### 5.1 Gerenciar Configuração

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/cases/[id]/portal/config` | Retorna config atual |
| `PATCH` | `/api/cases/[id]/portal/config` | Atualiza campos específicos |

**PATCH body:**
```json
{
  "showCalculations": true,
  "showProcessTracking": false
}
```

### 5.2 Gerenciar Link

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/cases/[id]/portal` | Retorna link atual (se válido) |
| `POST` | `/api/cases/[id]/portal` | Cria ou renova link (30 dias) |
| `DELETE` | `/api/cases/[id]/portal` | Revoga link imediatamente |

### 5.3 Portal Público (sem auth)

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/portal/[token]` | Dados do caso (filtrados por portalConfig) |
| `POST` | `/api/portal/[token]/simulate` | Simulador "E se?" (PRO) |
| `GET` | `/api/portal/[token]/documents` | Documentos compartilhados |
| `GET` | `/api/portal/[token]/timeline` | Timeline do caso |
| `GET` | `/api/portal/[token]/faq` | FAQ customizada por caso |
| `GET` | `/api/portal/[token]/export-pdf` | Exporta dados do portal em PDF |
| `POST` | `/api/portal/[token]/verify` | Verificação de identidade (CPF parcial + data nasc.) |

**Verificação de identidade:** Para módulos sensíveis, o cliente pode precisar verificar identidade com CPF parcial + data de nascimento antes de acessar.

---

## 6. UX do Advogado

O componente `PortalConfigCard` é um card na visão geral do caso com:

1. **Toggles individuais** para cada módulo — salvam automaticamente ao clicar
2. **Botão "Gerar link"** — cria o link compartilhável com 30 dias de validade
3. **Botão "Abrir portal"** — abre o link em nova aba (só aparece após gerar)
4. **Link copiável** com botão copy-to-clipboard
5. **Indicador de salvamento** (spinner) ao alterar configuração
6. **Aviso LGPD** no rodapé explicando o controle de dados

---

## 7. Dados expostos por módulo

| Módulo | Dados expostos | Risco |
|---|---|---|
| Acompanhamento processual | Nº processo, tribunal, última mov., resumo | 🟢 Baixo (nº processo é público) |
| Cálculos | RMI, RMA, modalidade, elegibilidade | 🟡 Médio (valores financeiros) |
| Retroativos | Valor bruto, corrigido, líquido | 🟡 Médio (valores financeiros) |
| Interpretação IA | Urgência, interpretação, ação sugerida | 🟢 Baixo (análise textual) |
| Timeline | Eventos do caso, prazos, movimentações | 🟢 Baixo |
| FAQ | Perguntas frequentes customizadas | 🟢 Baixo |
| Documentos | Documentos compartilhados seletivamente | 🟡 Médio |
| Glossário | Termos previdenciários explicados | 🟢 Baixo |

> **Nunca são expostos:** CPF, telefone, email, endereço, notas do prontuário, dados bancários.

---

## 8. Planos

| Funcionalidade | FREE | SOLO | PRO |
|---|---|---|---|
| Portal do Cliente | ❌ | ✅ (básico) | ✅ (com simulador) |
| Simulador "E se?" | ❌ | ❌ | ✅ |

O `portalConfig` está disponível em ambos os planos pagos — o que muda é a disponibilidade do simulador.
