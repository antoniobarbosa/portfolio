import eventBus from './EventBus';

/**
 * TriggerEngine - Sistema de Triggers
 * Escuta eventos, avalia condições e executa ações
 */
class TriggerEngine {
  constructor() {
    this.triggers = [];
    this.gameState = null;
    this.registeredTriggerIds = new Set(); // Para evitar duplicação
  }

  /**
   * Inicializa o TriggerEngine com o estado do jogo
   */
  init(gameState) {
    this.gameState = gameState;
    this.registerTriggers();
  }

  /**
   * Atualiza o estado do jogo
   */
  updateGameState(newState) {
    this.gameState = newState;
  }

  /**
   * Registra um trigger
   */
  register(trigger) {
    // Verifica se o trigger já foi registrado (evita duplicação)
    if (this.registeredTriggerIds.has(trigger.id)) {
      console.warn(`Trigger ${trigger.id} já foi registrado. Ignorando duplicata.`);
      return;
    }
    
    this.triggers.push(trigger);
    this.registeredTriggerIds.add(trigger.id);
    
    // Guarda referência ao callback para poder remover depois
    trigger._callbacks = [];
    
    // Registra listeners no EventBus para cada evento que o trigger escuta
    trigger.listenTo.forEach(eventName => {
      const callback = (event) => {
        this.handleEvent(event, trigger);
      };
      
      trigger._callbacks.push({ eventName, callback });
      eventBus.on(eventName, callback, trigger.priority || 0);
    });
  }

  /**
   * Registra todos os triggers
   */
  registerTriggers() {
    // Os triggers serão registrados pelos módulos de triggers
    // Este método pode ser sobrescrito ou usado para registrar triggers padrão
  }

  /**
   * Processa um evento para um trigger específico
   */
  handleEvent(event, trigger) {
    // Se o trigger é once e já foi executado, ignora
    if (trigger.once && trigger.executed) {
      return;
    }

    // Cria contexto para o trigger
    const ctx = {
      event,
      gameState: this.gameState,
      timestamp: Date.now(),
    };

    // Avalia condições
    if (trigger.conditions && !trigger.conditions(ctx)) {
      return;
    }

    // Executa ações
    if (trigger.actions) {
      trigger.actions(ctx);
    }

    // Marca como executado se for once
    if (trigger.once) {
      trigger.executed = true;
    }
  }

  /**
   * Remove um trigger
   */
  unregister(triggerId) {
    this.triggers = this.triggers.filter(t => t.id !== triggerId);
  }

  /**
   * Remove todos os triggers
   */
  clear() {
    this.triggers.forEach(trigger => {
      trigger.listenTo.forEach(eventName => {
        eventBus.removeAllListeners(eventName);
      });
    });
    this.triggers = [];
  }
}

// Singleton
const triggerEngine = new TriggerEngine();

export default triggerEngine;

