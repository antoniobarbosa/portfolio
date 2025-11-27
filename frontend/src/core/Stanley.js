import triggerEngine from "./TriggerEngine";
import { registerStanleyTriggers } from "./stanley/triggers";

/**
 * Stanley - Sistema de triggers para reações a eventos
 * Usa TriggerEngine para gerenciar quando e como reagir
 */
class Stanley {
  constructor() {
    this.gameState = null;
    this.triggersRegistered = false;
  }

  /**
   * Inicializa o Stanley e registra os triggers
   */
  init(gameState) {
    // Evita inicialização duplicada
    if (this.triggersRegistered && this.gameState === gameState) {
      return;
    }

    this.gameState = gameState;

    // Inicializa o TriggerEngine
    triggerEngine.init(gameState);

    // Registra os triggers do Stanley (apenas uma vez)
    if (!this.triggersRegistered) {
      registerStanleyTriggers();
      this.triggersRegistered = true;
    }
  }

  /**
   * Atualiza o estado do jogo
   */
  updateGameState(newState) {
    this.gameState = newState;
    triggerEngine.updateGameState(newState);
  }
}

// Singleton
const stanley = new Stanley();

export default stanley;
