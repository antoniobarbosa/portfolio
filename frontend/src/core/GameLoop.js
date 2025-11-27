/**
 * GameLoop - Singleton para gerenciar o loop principal do jogo
 * Atualiza o gamePlayTime continuamente baseado no tempo desde o início do jogo
 * Usa timestamp para garantir precisão na contagem de segundos
 */
class GameLoop {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.gameStateGetter = null;
    this.gameStateUpdater = null;
    this.interval = 1000; // 1 segundo
    this.gamePlayTimeBase = 0; // Valor base do servidor
  }

  /**
   * Define a função para obter o GameState atual
   */
  setGameStateGetter(getter) {
    this.gameStateGetter = getter;
  }

  /**
   * Define a função para atualizar o GameState
   */
  setGameStateUpdater(updater) {
    this.gameStateUpdater = updater;
  }

  /**
   * Inicia o game loop (nunca para, é contínuo)
   */
  start() {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.interval);
  }

  /**
   * Para o game loop
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  /**
   * Executa uma iteração do game loop
   * Incrementa o gamePlayTime a cada segundo
   */
  tick() {
    if (!this.gameStateGetter || !this.gameStateUpdater) {
      return;
    }

    // Incrementa +1
    this.gamePlayTimeBase += 1;

    // Atualiza o GameState
    this.gameStateUpdater({
      gamePlayTime: this.gamePlayTimeBase,
    });
  }

  /**
   * Sincroniza o gamePlayTime base com o valor do servidor
   */
  syncGamePlayTime(gamePlayTime) {
    this.gamePlayTimeBase = gamePlayTime || 0;
  }

  /**
   * Reinicia o game loop
   */
  restart() {
    this.stop();
    this.start();
  }

  /**
   * Define o intervalo do loop (em milissegundos)
   */
  setInterval(ms) {
    this.interval = ms;
    if (this.isRunning) {
      this.restart();
    }
  }

  /**
   * Obtém o status do game loop
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: this.interval,
      gamePlayTimeBase: this.gamePlayTimeBase,
    };
  }
}

// Singleton
const gameLoop = new GameLoop();

export default gameLoop;
