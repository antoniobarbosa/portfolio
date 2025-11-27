import eventBus from "./EventBus";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

/**
 * EventLogger - Envia apenas eventos significativos para o servidor
 * Eventos significativos: cliques em botões, divs, ações do usuário importantes
 */
class EventLogger {
  constructor() {
    this.enabled = true;
    this.initialized = false; // Flag para evitar inicialização duplicada
    this.currentSessionId = null; // ID da sessão atual
    this.getGameState = null; // Função para obter o GameState atual

    // Lista de eventos significativos que devem ser armazenados
    this.significantEvents = [
      "GAME_START",
      "GAME_STARTED",
      "USER_CLICK", // Cliques em botões/divs específicas
      "USER_NAVIGATE",
      "USER_TRY_EXIT",
      "CLIPPY_APPEAR",
      "CLIPPY_INTERRUPT",
      "NAVIGATE",
      "NAVIGATE_OVERRIDE",
      "BUTTON_CLICK", // Clique em botão específico
      "DIV_CLICK", // Clique em div específica
    ];

    // Guarda referência ao middleware para poder removê-lo se necessário
    this.middleware = null;
  }

  /**
   * Define a função para obter o GameState atual
   */
  setGameStateGetter(getGameStateFn) {
    this.getGameState = getGameStateFn;
  }

  /**
   * Inicializa o logger usando middleware do EventBus
   * Só loga eventos que têm listeners registrados (propagação principal)
   */
  init() {
    // Evita inicialização duplicada
    if (this.initialized) {
      return;
    }

    // Cria o middleware uma única vez
    this.middleware = (event, next) => {
      // Continua o fluxo normalmente primeiro (executa listeners)
      next();

      // Depois que os listeners executaram, verifica se deve logar
      // Usa Promise.resolve().then() para executar no próximo microtask
      // Isso garante que os listeners síncronos já atualizaram o gameState
      if (this.hasListeners(event.name)) {
        Promise.resolve().then(() => {
          this.logEvent(event);
        });
      }
    };

    // Registra o middleware
    eventBus.use(this.middleware);
    this.initialized = true;
  }

  /**
   * Verifica se um evento tem listeners registrados
   * Apenas eventos com listeners são considerados significativos
   * Isso garante que só eventos com propósito (com handlers definidos) sejam logados
   */
  hasListeners(eventName) {
    // Usa o método do EventBus para verificar listeners
    return eventBus.hasListeners(eventName);
  }

  /**
   * Verifica se um evento é significativo e deve ser armazenado
   * @deprecated - Use hasListeners() ao invés
   */
  isSignificant(event) {
    // Verifica se está na lista de eventos significativos
    if (this.significantEvents.includes(event.name)) {
      return true;
    }

    // Para USER_CLICK, verifica se é um clique em elemento significativo
    if (event.name === "USER_CLICK" && event.payload) {
      const target = event.payload.target;
      // Cliques em botões, divs com classes específicas, etc
      if (target === "BUTTON" || target === "DIV" || target === "A") {
        return true;
      }
    }

    return false;
  }

  /**
   * Adiciona um evento à lista de significativos
   */
  addSignificantEvent(eventName) {
    if (!this.significantEvents.includes(eventName)) {
      this.significantEvents.push(eventName);
    }
  }

  /**
   * Remove um evento da lista de significativos
   */
  removeSignificantEvent(eventName) {
    this.significantEvents = this.significantEvents.filter(
      (name) => name !== eventName
    );
  }

  /**
   * Loga um evento no servidor e envia apenas o gamePlayTime atual
   */
  async logEvent(event) {
    if (!this.enabled) return;

    // Obtém sessionId do localStorage (sessão atual)
    const sessionId =
      localStorage.getItem("portfolio_session_id") || this.currentSessionId;

    // Obtém o GameState atual completo
    const currentGameState = this.getGameState ? this.getGameState() : null;
    console.log("event.name");
    console.log(event.name);
    console.log("currentGameState");
    console.log(currentGameState);
    const eventData = {
      event: event.name,
      payload: event.payload || null,
      ts: event.timestamp || Date.now(),
      sessionId: sessionId,
      gamePlayTime: currentGameState?.gamePlayTime || 0, // Envia o playtime atual
      gameState: currentGameState, // Envia o gameState completo
    };

    try {
      const response = await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      // Se for erro 409 (conflito), trata como erro especial
      if (response.status === 409) {
        const errorData = await response.json();
        // Dispara evento de erro para o frontend decidir o que fazer
        window.dispatchEvent(
          new CustomEvent("GAMESTATE_CONFLICT", {
            detail: {
              error: errorData.error,
              gameState: errorData.gameState,
              sessionId: errorData.sessionId,
            },
          })
        );
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao salvar evento");
      }

      const result = await response.json();

      // Se o evento criou uma nova sessão (GAME_START), salva no localStorage
      if (result.sessionId) {
        this.currentSessionId = result.sessionId;
        localStorage.setItem("portfolio_session_id", result.sessionId);
      }

      // Se for sucesso (200), não faz nada - apenas continua funcionando
      // O servidor retorna apenas { success: true } quando tudo OK
    } catch (error) {
      console.error("Erro ao logar evento:", error);
      // Pode implementar retry logic aqui se necessário
    }
  }

  /**
   * Habilita/desabilita o logger
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

// Singleton
const eventLogger = new EventLogger();

export default eventLogger;
