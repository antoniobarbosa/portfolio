/**
 * EventBus - Sistema central de eventos
 * Gerencia emissão e escuta de eventos em toda a aplicação
 */
class EventBus {
  constructor() {
    this.listeners = new Map();
    this.middlewares = [];
  }

  /**
   * Verifica se um evento tem listeners registrados
   */
  hasListeners(eventName) {
    const listeners = this.listeners.get(eventName);
    return listeners && listeners.length > 0;
  }

  /**
   * Registra um middleware que será executado antes dos listeners
   * @param {Function} middleware - Função (event, next) => void
   */
  use(middleware) {
    // Evita adicionar o mesmo middleware duas vezes
    if (this.middlewares.includes(middleware)) {
      return;
    }
    this.middlewares.push(middleware);
  }

  /**
   * Emite um evento
   * @param {string} name - Nome do evento
   * @param {any} payload - Dados do evento
   */
  emit(name, payload = null) {
    const event = {
      name,
      payload,
      timestamp: Date.now(),
      cancelled: false,
    };

    // Executa middlewares em sequência
    let middlewareIndex = 0;
    const runMiddlewares = () => {
      if (middlewareIndex >= this.middlewares.length) {
        // Todos os middlewares executaram, agora executa os listeners
        this.executeListeners(event);
        return;
      }

      const middleware = this.middlewares[middlewareIndex++];
      middleware(event, () => {
        if (!event.cancelled) {
          runMiddlewares();
        }
      });
    };

    runMiddlewares();
  }

  /**
   * Executa os listeners registrados para o evento
   * @param {Object} event - Objeto do evento
   */
  executeListeners(event) {
    if (event.cancelled) return;

    const listeners = this.listeners.get(event.name) || [];
    
    // Ordena por prioridade (maior primeiro)
    const sortedListeners = listeners.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    sortedListeners.forEach(({ callback }) => {
      if (!event.cancelled) {
        callback(event);
      }
    });
  }

  /**
   * Registra um listener para um evento
   * @param {string} eventName - Nome do evento
   * @param {Function} callback - Função callback
   * @param {number} priority - Prioridade (maior = executa primeiro)
   */
  on(eventName, callback, priority = 0) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName).push({ callback, priority });
  }

  /**
   * Remove um listener
   * @param {string} eventName - Nome do evento
   * @param {Function} callback - Função callback a remover
   */
  off(eventName, callback) {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      const index = listeners.findIndex(l => l.callback === callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Remove todos os listeners de um evento
   * @param {string} eventName - Nome do evento
   */
  removeAllListeners(eventName) {
    this.listeners.delete(eventName);
  }
}

// Singleton
const eventBus = new EventBus();

export default eventBus;

