/**
 * AchievementManager - Singleton para gerenciar achievements
 * Função global para adicionar achievements ao gameState
 */
class AchievementManager {
  constructor() {
    this.gameStateGetter = null;
    this.gameStateUpdater = null;
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
   * Adiciona um achievement ao gameState (apenas o ID)
   * @param {string} achievementId - ID do achievement
   * @returns {boolean} - true se foi adicionado, false se já existia
   */
  addAchievement(achievementId) {
    if (!this.gameStateGetter || !this.gameStateUpdater) {
      return false;
    }

    const currentState = this.gameStateGetter();
    if (!currentState) {
      return false;
    }

    // Verifica se o achievement já existe
    const existingAchievements = currentState.achievements || [];
    if (existingAchievements.includes(achievementId)) {
      return false;
    }

    // Adiciona apenas o ID
    const updatedAchievements = [...existingAchievements, achievementId];

    // Atualiza o gameState
    this.gameStateUpdater({
      achievements: updatedAchievements,
    });

    // O TriggerEngine será notificado automaticamente via updateGameState
    // quando o gameState mudar (através do Stanley.updateGameState)

    return true;
  }

  /**
   * Verifica se um achievement já foi conquistado
   * @param {string} achievementId - ID do achievement
   * @returns {boolean}
   */
  hasAchievement(achievementId) {
    if (!this.gameStateGetter) {
      return false;
    }

    const currentState = this.gameStateGetter();
    if (!currentState || !currentState.achievements) {
      return false;
    }

    return currentState.achievements.includes(achievementId);
  }

  /**
   * Obtém todos os achievements
   * @returns {Array}
   */
  getAchievements() {
    if (!this.gameStateGetter) {
      return [];
    }

    const currentState = this.gameStateGetter();
    return currentState?.achievements || [];
  }

  /**
   * Adiciona o próximo achievement cumulativo na sequência
   * Exemplo: addCumulativeAchievement("about") adiciona "about_1", depois "about_2", etc.
   * @param {string} baseId - ID base do achievement (ex: "about")
   * @param {number} maxCount - Número máximo de achievements na sequência (padrão: 10)
   * @returns {string|null} - ID do achievement adicionado, ou null se já atingiu o máximo
   */
  addCumulativeAchievement(baseId, maxCount = 10) {
    if (!this.gameStateGetter) {
      return null;
    }

    const currentState = this.gameStateGetter();
    if (!currentState || !currentState.achievements) {
      return null;
    }

    const existingAchievements = currentState.achievements || [];

    // Encontra o próximo número na sequência
    let nextNumber = 1;
    for (let i = 1; i <= maxCount; i++) {
      const achievementId = `${baseId}_${i}`;
      if (!existingAchievements.includes(achievementId)) {
        nextNumber = i;
        break;
      }
      // Se já tem todos até maxCount, retorna null
      if (i === maxCount) {
        return null;
      }
      nextNumber = i + 1;
    }

    // Adiciona o próximo achievement na sequência
    const achievementId = `${baseId}_${nextNumber}`;
    this.addAchievement(achievementId);

    return achievementId;
  }

  /**
   * Remove um achievement (útil para testes/debug)
   * @param {string} achievementId - ID do achievement
   * @returns {boolean}
   */
  removeAchievement(achievementId) {
    if (!this.gameStateGetter || !this.gameStateUpdater) {
      return false;
    }

    const currentState = this.gameStateGetter();
    if (!currentState || !currentState.achievements) {
      return false;
    }

    const updatedAchievements = currentState.achievements.filter(
      (id) => id !== achievementId
    );

    this.gameStateUpdater({
      achievements: updatedAchievements,
    });

    return true;
  }
}

// Singleton
const achievementManager = new AchievementManager();

// Torna disponível globalmente
if (typeof window !== "undefined") {
  window.addAchievement = (achievementId) => {
    return achievementManager.addAchievement(achievementId);
  };
  window.addCumulativeAchievement = (baseId, maxCount) => {
    return achievementManager.addCumulativeAchievement(baseId, maxCount);
  };
  window.hasAchievement = (achievementId) => {
    return achievementManager.hasAchievement(achievementId);
  };
  window.getAchievements = () => {
    return achievementManager.getAchievements();
  };
}

export default achievementManager;
