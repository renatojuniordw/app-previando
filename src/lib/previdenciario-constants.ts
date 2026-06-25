// ─── Constantes Previdenciárias ──────────────────────────────────────────
// EC 103/2019 (Reforma da Previdência) + Leis 8.213/91 e 8.742/93

// Pisos e tetos (fallbacks)
export const SALARIO_MINIMO_FALLBACK = 1621.00
export const TETO_PREVIDENCIARIO_FALLBACK = 8157.41

// Carências (Art. 27 Lei 8.213/91 e alterações)
export const CARENCIA_APOSENTADORIA_MESES = 180    // 15 anos
export const CARENCIA_AUXILIO_DOENCA_MESES = 12    // Art. 25, I
export const CARENCIA_PENSAO_MORTE_MESES = 18      // Afeta duração, não elegibilidade

// Coeficientes de cálculo (Art. 26, EC 103/2019)
export const COEFICIENTE_BASE = 0.60                 // Coeficiente inicial
export const ACRESCIMO_ANUAL = 0.02                  // 2% por ano excedente
export const ANOS_BASE_EXCEDENTE_M = 20              // Homens: acréscimo a partir de 20 anos
export const ANOS_BASE_EXCEDENTE_F = 15              // Mulheres: acréscimo a partir de 15 anos

// Conversão tempo especial → comum
export const MULTIPLICADOR_ESPECIAL_ACRESCIMO_M = 0.4 // Homem
export const MULTIPLICADOR_ESPECIAL_ACRESCIMO_F = 0.2 // Mulher

// Fator previdenciário
export const FATOR_PREVID_MIN = 0.4                   // Limite mínimo
export const FATOR_PREVID_MAX = 1.2                   // Limite máximo
export const DENOMINADOR_PEDAGIO_50 = 2200            // Denominador da fórmula do pedágio 50%

// Auxílio-doença
export const COEFICIENTE_AUXILIO_DOENCA = 0.91        // Art. 61 Lei 8.213/91

// Datas base
export const DATA_LIMITE_94 = new Date('1994-07-01')  // Início do Plano Real — base de cálculo pós-reforma

// Taxa de correção INPC fallback
export const FALLBACK_INPC_MENSAL = 0.0035            // 0.35% mensal
