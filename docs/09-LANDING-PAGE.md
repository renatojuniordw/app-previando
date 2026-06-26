# 09 — LANDING PAGE
> previando.com.br — Copy, Estrutura e Estratégia de Tráfego Pago

---

## Identidade

| | |
|---|---|
| **Nome** | Previando |
| **Site** | previando.com.br |
| **App** | app.previando.com.br |
| **Email** | contato@previando.com.br |
| **Instagram** | @previando |
| **Tagline** | Previdência inteligente para advogados |
| **Repo** | previando-web |
| **Stack LP** | React (Vite) — porta 60001 |

---

## Estratégia de Conversão

```
Anúncio (Meta/Google) → previando.com.br → CTA → app.previando.com.br/register
```

- Não vender plano pago direto no anúncio
- O produto vende sozinho após o advogado experimentar e atingir o limite
- CTA sempre aponta para `app.previando.com.br/register`

---

## Estrutura da LP

### HERO
**Headline:** Você ainda calcula aposentadoria de cliente no Excel?
**Sub:** O Previando transforma o CNIS em cálculo completo — RMI, RMA, retroativos e parecer — em minutos. Sem planilha. Sem erro. Com IA.
**CTA:** → Começar grátis — sem cartão de crédito → `app.previando.com.br/register`
**Trust:** ✓ Gratuito para começar · ✓ Login com Google · ✓ Dados criptografados

### PROBLEMA
3 cards de dor que o advogado se identifica:
- Horas perdidas em cálculo manual
- Medo de erro que prejudica o cliente
- Perda de controle dos casos e prazos

### COMO FUNCIONA
3 passos: Upload CNIS → Cálculo automático → Parecer e gestão

### FEATURES
8 features com ícone, título e descrição objetiva

### PROVA SOCIAL (sem depoimentos)
- 14 modalidades de cálculo implementadas
- 100% dos bloqueios verificados no servidor
- 0 CPFs armazenados em texto puro
- 3 cards: Legislação atualizada / Dados seguros / Feito com especialista

### PLANOS
Tabela FREE / SOLO / PRO com âncora de custo de oportunidade:
> "Um único caso de revisão pode valer R$ 5.000 a R$ 30.000 em honorários. O Previando Solo custa R$ 299/mês."

### FAQ
6 perguntas: instalação, confiabilidade, segurança, cancelamento, atualizações, benefícios suportados

### CTA FINAL
"Teste agora. Grátis. Sem cartão."
CTA → `app.previando.com.br/register`

### RODAPÉ
previando.com.br · contato@previando.com.br · @previando

---

## Copy para Anúncios Meta Ads

### Criativo 1 — Dor direta
**Headline:** Ainda calcula aposentadoria no Excel?
**Texto:**
Advogados previdenciários perdem horas por semana em cálculos que um sistema resolve em minutos.

O Previando lê o CNIS automaticamente, calcula RMI/RMA com todas as regras da EC 103/2019 e gera o parecer com IA.

Comece grátis em previando.com.br

### Criativo 2 — Custo de oportunidade
**Headline:** Quanto você deixou de ganhar por erro de cálculo?
**Texto:**
Um cálculo errado de retroativo pode custar R$ 10.000+ ao seu cliente.

O Previando calcula retroativos mês a mês com correção por INPC e memória de cálculo completa.

14 modalidades. Sempre atualizado. Começa grátis.

### Criativo 3 — Transformação
**Headline:** De 2 horas para 10 minutos por caso previdenciário
**Texto:**
Upload do CNIS → cálculo automático → parecer com IA → resumo no WhatsApp do cliente.

Feito com quem entende o dia a dia do advogado previdenciário.

Grátis para começar em previando.com.br

---

## Google Ads

### Keywords
```
"calculadora previdenciária advogado"
"calcular rmi inss"
"cálculo aposentadoria ec 103 2019"
"software previdenciário online"
"sistema previdenciário advogado"
"calculadora rmi rma"
"cálculo retroativos previdenciários"
```

### Anúncio
**H1:** Calculadora Previdenciária com IA
**H2:** EC 103/2019 — Todas as Regras
**H3:** Grátis para Começar | Previando
**Descrição:** Calcule RMI, RMA e retroativos do CNIS automaticamente. Parecer com IA e CRM Kanban. Para advogados previdenciários.

---

## Identidade Visual

```
Paleta:
  Azul-marinho:  #0F1E3C  (autoridade jurídica)
  Dourado:       #C9890A  (valor, CTAs)
  Branco:        #FAFAFA
  Grafite:       #2D2D2D

Tipografia:
  Display:  Playfair Display (elegância jurídica)
  Body:     Source Serif 4
  Dados/UI: JetBrains Mono

Tom: Refinado e sério — escritório premium, não startup genérica
```

---

## Métricas Alvo

| Métrica | Meta |
|---|---|
| Conversão LP → Cadastro | > 8% |
| Ativação (fez 1 cálculo) | > 60% |
| Upgrade FREE → Pago (30 dias) | > 15% |
| CAC (Meta Ads) | < R$ 80 |
| LTV SOLO (18 meses) | R$ 5.382 |

---

## Checklist Pré-Launch

- [ ] previando.com.br com SSL (Let's Encrypt no Contabo)
- [ ] Pixel Meta instalado (rastrear cadastros em app.previando.com.br)
- [ ] Google Tag Manager configurado
- [ ] Evento de conversão: "Cadastro realizado"
- [ ] Heatmap ativo (Microsoft Clarity — grátis)
- [ ] Mobile testado (iOS + Android)
- [ ] PageSpeed > 90
- [ ] @previando no Instagram ativo com link para previando.com.br
- [ ] contato@previando.com.br configurado
- [ ] Termos de Uso e Política de Privacidade publicados (obrigatório para Meta Ads)
- [ ] UTM parameters nos links dos anúncios
