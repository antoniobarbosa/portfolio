import routesConfig from "./routes-config.json";
import triggerEngine from "../TriggerEngine";
import audioPlayer from "../AudioPlayer";

/**
 * Carrega e registra triggers baseados na configuração de rotas
 */
export function loadRoutesConfig() {
  // Registra triggers para achievements específicos
  if (routesConfig.achievements) {
    routesConfig.achievements.forEach((config) => {
      triggerEngine.register({
        id: `stanley_${config.id}`,
        listenTo: [config.id],
        once: config.once !== false, // Padrão: true
        priority: config.priority || 20,
        conditions: (ctx) => {
          return config.conditions ? config.conditions(ctx) : true;
        },
        actions: (ctx) => {
          if (config.audio) {
            audioPlayer.play(config.audio.file, {
              volume: config.audio.volume || 0.7,
            });
          }
        },
      });
    });
  }

  // Registra triggers para rotas (achievements cumulativos)
  if (routesConfig.routes) {
    routesConfig.routes.forEach((route) => {
      // Cria um trigger para cada achievement possível (1 até maxAchievements)
      for (let i = 1; i <= route.maxAchievements; i++) {
        const achievementId = `${route.achievementBase}_${i}`;

        triggerEngine.register({
          id: `stanley_${achievementId}`,
          listenTo: [achievementId],
          once: true, // Cada achievement só toca uma vez
          priority: route.priority || 20,
          conditions: (ctx) => {
            return route.conditions ? route.conditions(ctx) : true;
          },
          actions: (ctx) => {
            if (route.audio) {
              audioPlayer.play(route.audio.file, {
                volume: route.audio.volume || 0.7,
              });
            }
          },
        });
      }
    });
  }
}
