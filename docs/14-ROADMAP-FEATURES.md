# 14 — ROADMAP DE FEATURES DIFERENCIADAS

> Estratégia de diferenciação do Previando frente aos concorrentes
> Última atualização: 2026-06-28

---

## Sumário

1. [Petição Inicial Automática](#1-petição-inicial-automática-✅)
2. [Portal do Cliente + Simulador "E se?"](#2-portal-do-cliente--simulador-e-se-✅)
3. [Revisão de Benefício Automática](#3-revisão-de-benefício-automática-✅)
4. [Onboarding Assistido por IA](#4-onboarding-assistido-por-ia-✅)
5. [Importar de Outros Sistemas](#5-importar-de-outros-sistemas-✅)
6. [Próximos Passos](#6-próximos-passos)

---

## 1. Petição Inicial Automática ✅

**Status:** Implementado
**Disponível em:** SOLO+PRO (features pagas)
**Custo de IA:** ~R$ 0,01-0,02 por petição

### O que faz
Gera automaticamente uma **petição inicial completa** com base nos dados do caso, cálculo selecionado e CNIS. A petição segue a estrutura jurídica formal brasileira:
- Endereçamento ao juízo competente
- Qualificação do segurado
- Dos Fatos (histórico do CNIS)
- Do Direito (fundamentação legal)
- Dos Pedidos (concessão + retroativos)
- Das Provas
- Fechamento (advogado + OAB)

### Arquivos criados
| Arquivo | Função |
|---|---|
| `src/lib/prompts/peticao-inicial.ts` | Prompt de sistema para IA |
| `src/services/peticao-generator.ts` | Serviço de geração com OpenAI |
| `src/app/api/cases/[id]/peticao/route.ts` | API endpoint (POST) |
| `src/components/case/CasePeticaoModal.tsx` | Modal de UI para gerar/copiar/download |

### Integração
- Botão no FAB (Floating Actions) do caso
- Rate limit: 10 petições/hora por usuário
- Requer cálculo selecionado como definitivo

---

## 2. Portal do Cliente + Simulador "E se?" ✅

**Status:** Implementado
**Disponível em:** PRO (simulador) / SOLO+PRO (portal básico)

### O que faz
O Portal do Cliente existente foi expandido com:
- **Simulador "E se?"** — o cliente pode simular cenários futuros:
  - Escolher uma data futura para aposentadoria
  - Definir valor de contribuição mensal
  - Ver comparativo: RMI hoje vs RMI projetada
  - Ver ganho mensal estimado
- Interface mais amigável e responsiva

### Arquivos criados/modificados
| Arquivo | Função |
|---|---|
| `src/app/api/portal/[token]/simulate/route.ts` | API pública (via token) para simulação |
| `src/components/portal/PortalSimulator.tsx` | Componente React client-side do simulador |
| `src/app/portal/[token]/page.tsx` | Página do portal atualizada |

### Segurança
- Endpoint público mas protegido por token + expiry
- Rate limit: 5 simulações/hora por token
- Apenas modalidade padrão (Aposentadoria por Idade)
- Sem acesso a dados sensíveis além do necessário

---

## 3. Revisão de Benefício Automática ✅

**Status:** Já existente (aprimorado)
**Disponível em:** SOLO+PRO

### O que faz
Compara automaticamente **todas as modalidades de benefício** disponíveis e retorna:
- Quais são elegíveis vs não elegíveis
- Melhor RMI entre todas as modalidades
- Pendências para cada modalidade
- Ordenado por melhor resultado

### Arquivos existentes
| Arquivo | Função |
|---|---|
| `src/app/api/cases/[id]/suggest-modalities/route.ts` | API que calcula 22 cenários (M+F para 11 modalidades) |
| `src/app/(dashboard)/cases/[id]/compare/page.tsx` | Página de comparativo com UI |

### Diferencial
Nenhum concorrente oferece comparação automática de TODAS as modalidades simultaneamente. Astrea e ProJuris não têm calculadora especializada. CJ e Previdenciarista exigem que o usuário teste manualmente.

---

## 4. Onboarding Assistido por IA ✅

**Status:** Implementado
**Disponível em:** FREE (para todos)

### O que faz
O wizard de onboarding foi aprimorado com:
- **Mensagem de boas-vindas personalizada** baseada no progresso real do usuário
- **Dicas contextuais** em cada etapa do onboarding
- Detecção automática de onde o usuário parou
- Sugestões inteligentes ("Comece cadastrando seu primeiro cliente")

### Arquivos modificados
| Arquivo | Mudança |
|---|---|
| `src/components/onboarding/OnboardingWizard.tsx` | Adicionado dicas IA + boas-vindas personalizada |
| `src/app/api/onboarding/progress/route.ts` | Já existente, agora com mais dados |

### Fluxo
```
Usuário loga → API /onboarding/progress → verifica o que já foi feito
  → Gera mensagem personalizada → Exibe wizard com dicas contextuais
```

---

## 5. Importar de Outros Sistemas ✅

**Status:** Implementado
**Disponível em:** FREE (para todos)

### O que faz
Importação de clientes em lote via:
- **CSV** (já existente) — nome, CPF, data de nascimento, telefone, email, prioridade
- Suporte a cabeçalho (primeira linha)
- Detecção automática de duplicatas por CPF
- Validação de limite do plano
- Relatório detalhado de importação

### Arquivos modificados
| Arquivo | Mudança |
|---|---|
| `src/app/api/clients/import/route.ts` | Documentação aprimorada, suporte a mais formatos |

### Limites
- 3 importações/hora por usuário
- Máximo 500 linhas por importação
- Arquivo máximo 2MB

---

## 6. Próximos Passos

### Curto prazo (30 dias)
| Feature | Esforço | Impacto |
|---|---|---|
| **Notificações push** — cliente recebe notificação quando CNIS processado, cálculo pronto | Baixo | Alto |
| **Portal do Cliente versão mobile** — PWA | Baixo | Alto |

### Médio prazo (60-90 dias)
| Feature | Esforço | Impacto |
|---|---|---|
| **App Mobile (React Native)** | Alto | Médio |
| **Integração Astrea/ProJuris via API** | Alto | Alto |
| **Painel de BI para o escritório** | Médio | Alto |
| **Módulo de Custas e Honorários** | Médio | Médio |

### Visão de longo prazo
| Feature | Impacto |
|---|---|
| **Assinatura Digital de Petições** | Altíssimo |
| **Integração direta com o sistema INSS (e-Proc)** | Altíssimo |
| **Marketplace de Peritos e Laudos** | Alto |

---

## Resumo de Investimento em IA

| Operação | Modelo | Custo médio | Plano |
|---|---|---|---|
| Parecer Jurídico | gpt-4.1-mini | ~R$ 0,015 | SOLO/PRO |
| **Petição Inicial** | **gpt-4.1-mini** | **~R$ 0,02** | **SOLO/PRO** |
| Diagnóstico Prontuário | gpt-4.1-mini | ~R$ 0,01 | SOLO/PRO |
| CNIS Parse | gpt-4.1-mini | ~R$ 0,10 | Todos |
| BPC Análises | gpt-4o-mini | ~R$ 0,005 | SOLO/PRO |

**Custo total projetado para 100 usuários ativos:** ~R$ 35-50/mês

---

## Legendas de Planos

| Feature | FREE | SOLO (R$97) | PRO (R$197) |
|---|---|---|---|
| Petição Inicial | ❌ | ✅ (5/mês) | ✅ (ilimitado) |
| Portal do Cliente | ❌ | ✅ (básico) | ✅ (com simulador) |
| Simulador "E se?" (Portal) | ❌ | ❌ | ✅ |
| Revisão de Modalidades | ❌ | ✅ | ✅ |
| Onboarding IA | ✅ | ✅ | ✅ |
| Importar CSV | ✅ | ✅ | ✅ |
