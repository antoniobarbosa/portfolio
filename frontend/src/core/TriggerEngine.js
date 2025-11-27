import eventBus from "./EventBus";

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
    const oldAchievements = this.gameState?.achievements || [];
    const newAchievements = newState?.achievements || [];

    // Detecta achievements recém-adicionados
    const addedAchievements = newAchievements.filter(
      (achievementId) => !oldAchievements.includes(achievementId)
    );

    // Se houver achievements novos, verifica triggers que escutam achievements
    if (addedAchievements.length > 0) {
      addedAchievements.forEach((achievementId) => {
        this.handleAchievement(achievementId);
      });
    }

    this.gameState = newState;
  }

  /**
   * Processa um achievement recém-adicionado
   */
  handleAchievement(achievementId) {
    // Encontra triggers que escutam este achievement
    const triggers = this.triggers.filter((trigger) =>
      trigger.listenTo.includes(achievementId)
    );

    triggers.forEach((trigger) => {
      // Se o trigger é once e já foi executado, ignora
      if (trigger.once && trigger.executed) {
        return;
      }

      // Cria contexto para o trigger (similar ao handleEvent)
      const ctx = {
        achievementId,
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
    });
  }

  /**
   * Registra um trigger
   */
  register(trigger) {
    // Verifica se o trigger já foi registrado (evita duplicação)
    if (this.registeredTriggerIds.has(trigger.id)) {
      console.warn(
        `Trigger ${trigger.id} já foi registrado. Ignorando duplicata.`
      );
      return;
    }

    this.triggers.push(trigger);
    this.registeredTriggerIds.add(trigger.id);

    // Guarda referência ao callback para poder remover depois
    trigger._callbacks = [];

    // Separa eventos do EventBus de achievements
    trigger.listenTo.forEach((name) => {
      // Verifica se é um evento do EventBus (tem listeners registrados ou é um evento conhecido)
      // Se não for evento, assume que é um achievement
      const isEvent = eventBus.hasListeners(name) || this.isKnownEvent(name);

      if (isEvent) {
        // Registra listener no EventBus para eventos
        const callback = (event) => {
          this.handleEvent(event, trigger);
        };

        trigger._callbacks.push({ eventName: name, callback, type: "event" });
        eventBus.on(name, callback, trigger.priority || 0);
      } else {
        // É um achievement - será processado via updateGameState
        trigger._callbacks.push({ eventName: name, type: "achievement" });

        // Se o achievement já existe no gameState atual, executa imediatamente
        if (this.gameState?.achievements?.includes(name)) {
          this.handleAchievement(name);
        }
      }
    });
  }

  /**
   * Verifica se é um evento conhecido do EventBus
   */
  isKnownEvent(name) {
    // Lista de eventos conhecidos (pode ser expandida)
    const knownEvents = [
      "GAME_START",
      "GAME_STARTED",
      "USER_CLICK",
      "USER_NAVIGATE",
      "USER_TRY_EXIT",
      "CLIPPY_APPEAR",
      "CLIPPY_INTERRUPT",
      "NAVIGATE",
      "NAVIGATE_OVERRIDE",
      "BUTTON_CLICK",
      "DIV_CLICK",
    ];
    return knownEvents.includes(name);
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
    this.triggers = this.triggers.filter((t) => t.id !== triggerId);
  }

  /**
   * Remove todos os triggers
   */
  clear() {
    this.triggers.forEach((trigger) => {
      trigger.listenTo.forEach((eventName) => {
        eventBus.removeAllListeners(eventName);
      });
    });
    this.triggers = [];
  }
}

// Singleton
const triggerEngine = new TriggerEngine();

export default triggerEngine;
