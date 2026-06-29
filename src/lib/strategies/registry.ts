/**
 * Registry de Estratégias Previdenciárias
 * Gerencia o mapeamento entre código de modalidade e sua estratégia de cálculo.
 * Permite registrar novas modalidades sem modificar código existente (OCP).
 */

import type { ModalidadeStrategy } from './types'
import {
  AposentadoriaIdadeStrategy,
  IdadeMinimaProgressivaStrategy,
  TempoContribuicaoStrategy,
  PontosStrategy,
  Pedagio50Strategy,
  Pedagio100Strategy,
  AposentadoriaEspecialStrategy,
  HibridaStrategy,
} from './retirement'
import {
  AuxilioDoencaB31Strategy,
  AuxilioDoencaB91Strategy,
  SalarioMaternidadeStrategy,
  AuxilioReclusaoStrategy,
  PensaoMorteStrategy,
  BpcLoasStrategy,
} from './assistenciais'
import {
  RevisaoVidaTodaStrategy,
  RevisaoArtigo29Strategy,
  RevisaoBuracoNegroStrategy,
} from './revision'

/**
 * Default strategy used when no strategy is registered for a given modality.
 * Returns not eligible with a pendency message.
 */
class DefaultStrategy implements ModalidadeStrategy {
  readonly modalidade = '__default__'

  evaluate(_input: import('./types').ModalidadeEvaluationInput): import('./types').ModalidadeEvaluationResult {
    return {
      elegivel: false,
      coeficiente: 0.6,
      pendencias: ['Modalidade de cálculo não parametrizada.'],
    }
  }
}

const DEFAULT_STRATEGY = new DefaultStrategy()

/**
 * Registry holding all strategy instances, keyed by modality code.
 * Add new strategies here — no switch statements needed.
 */
const STRATEGIES: Map<string, ModalidadeStrategy> = new Map<string, ModalidadeStrategy>([
  ['APOSENTADORIA_IDADE', new AposentadoriaIdadeStrategy()],
  ['IDADE_MINIMA_65_62', new IdadeMinimaProgressivaStrategy()],
  ['TEMPO_CONTRIBUICAO', new TempoContribuicaoStrategy()],
  ['PONTOS_86_96', new PontosStrategy()],
  ['PEDAGIO_50', new Pedagio50Strategy()],
  ['PEDAGIO_100', new Pedagio100Strategy()],
  ['APOSENTADORIA_ESPECIAL', new AposentadoriaEspecialStrategy()],
  ['HIBRIDA', new HibridaStrategy()],
  ['AUXILIO_DOENCA_B31', new AuxilioDoencaB31Strategy()],
  ['AUXILIO_DOENCA_B91', new AuxilioDoencaB91Strategy()],
  ['SALARIO_MATERNIDADE', new SalarioMaternidadeStrategy()],
  ['AUXILIO_RECLUSAO', new AuxilioReclusaoStrategy()],
  ['PENSAO_MORTE', new PensaoMorteStrategy()],
  ['BPC_LOAS', new BpcLoasStrategy()],
  ['REVISAO_VIDA_TODA', new RevisaoVidaTodaStrategy()],
  ['REVISAO_ART_29', new RevisaoArtigo29Strategy()],
  ['REVISAO_BURACO_NEGRO', new RevisaoBuracoNegroStrategy()],
])

/**
 * Retrieves the strategy for the given modality code.
 * Falls back to a default strategy if none is registered.
 */
export function getStrategy(modality: string): ModalidadeStrategy {
  return STRATEGIES.get(modality) ?? DEFAULT_STRATEGY
}

/**
 * Returns the list of all registered modality codes.
 */
export function getRegisteredModalities(): string[] {
  return Array.from(STRATEGIES.keys())
}

/**
 * Registers a new strategy at runtime (useful for tests or plugins).
 */
export function registerStrategy(strategy: ModalidadeStrategy): void {
  STRATEGIES.set(strategy.modalidade, strategy)
}
