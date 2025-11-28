import achievementManager from "./AchievementManager";

/**
 * MouseoverManager - Gerencia mouseovers com throttle para evitar spam
 * Garante intervalo mínimo entre achievements cumulativos
 */
class MouseoverManager {
  constructor() {
    this.lastMouseoverTimes = new Map(); // Map<achievementBase, timestamp>
    this.minInterval = 30000; // 30 segundos em milissegundos
  }

  /**
   * Registra um mouseover para um achievement cumulativo
   * @param {string} achievementBase - Base do achievement (ex: "linkedin", "github", "email")
   * @param {number} maxAchievements - Número máximo de achievements (padrão: 10)
   * @returns {boolean} - true se adicionou, false se ainda está no cooldown
   */
  handleMouseover(achievementBase, maxAchievements = 10) {
    const now = Date.now();
    const lastTime = this.lastMouseoverTimes.get(achievementBase) || 0;
    const timeSinceLastMouseover = now - lastTime;

    // Se ainda não passou o intervalo mínimo, ignora
    if (timeSinceLastMouseover < this.minInterval) {
      return false;
    }

    // Adiciona o achievement cumulativo
    const achievementId = achievementManager.addCumulativeAchievement(
      achievementBase,
      maxAchievements
    );

    // Se adicionou com sucesso, atualiza o timestamp
    if (achievementId) {
      this.lastMouseoverTimes.set(achievementBase, now);
      return true;
    }

    return false;
  }

  /**
   * Define o intervalo mínimo (em milissegundos)
   * @param {number} ms - Intervalo mínimo em milissegundos
   */
  setMinInterval(ms) {
    this.minInterval = ms;
  }

  /**
   * Reseta o timestamp de um achievement base
   * @param {string} achievementBase - Base do achievement
   */
  reset(achievementBase) {
    this.lastMouseoverTimes.delete(achievementBase);
  }

  /**
   * Reseta todos os timestamps
   */
  resetAll() {
    this.lastMouseoverTimes.clear();
  }
}

// Singleton
const mouseoverManager = new MouseoverManager();

// Torna disponível globalmente
if (typeof window !== "undefined") {
  window.handleMouseover = (achievementBase, maxAchievements) => {
    return mouseoverManager.handleMouseover(achievementBase, maxAchievements);
  };
}

export default mouseoverManager;

