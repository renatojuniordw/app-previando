import {
  CalculationOrchestrator,
  RunCalculationInput,
} from './previdencia/calculation-orchestrator'
import {
  SimulationOrchestrator,
  RunSimulationInput,
} from './previdencia/simulation-orchestrator'
import {
  RetroativoOrchestrator,
  RunRetroativoInput,
} from './previdencia/retroativo-orchestrator'

// Exportando novamente as interfaces para manter compatibilidade de tipos absoluta com outros arquivos
export type { RunCalculationInput, RunSimulationInput, RunRetroativoInput }

/**
 * Classe Fachada (Facade) que centraliza e delega as operações previdenciárias.
 * Mantém 100% de retrocompatibilidade com as rotas de API existentes do Next.js,
 * permitindo que as rotas continuem funcionando de forma transparente enquanto
 * as regras de negócio de cada fluxo (Cálculo, Simulação e Retroativo) são
 * isoladas em classes especializadas sob o princípio de SOLID (SRP).
 */
export class PrevidenciaService {
  /**
   * Orquestra de forma segura o cálculo previdenciário (RMI e elegibilidade) no servidor
   * e salva o resultado final no banco de dados.
   */
  static async runAndSaveCalculation(input: RunCalculationInput) {
    return CalculationOrchestrator.run(input)
  }

  /**
   * Orquestra de forma segura a simulação de planejamento futuro no servidor
   * e salva o resultado no banco de dados.
   */
  static async runAndSaveSimulation(input: RunSimulationInput) {
    return SimulationOrchestrator.run(input)
  }

  /**
   * Orquestra e calcula de forma segura as parcelas judiciais retroativas vencidas
   * atualizadas monetariamente pelo INPC e salva no banco de dados.
   */
  static async runAndSaveRetroativo(input: RunRetroativoInput) {
    return RetroativoOrchestrator.run(input)
  }
}
