import triggerEngine from "../TriggerEngine";
import audioPlayer from "../AudioPlayer";
import eventBus from "../EventBus";

/**
 * Triggers do Stanley
 * Cada trigger define quando e como Stanley deve reagir a eventos
 */

const AUDIO_BASE = "/audio/stanleys_parable";

/**
 * Registra todos os triggers do Stanley
 */
export function registerStanleyTriggers() {
  // Trigger: Game Start → Toca áudio e inicia o jogo
  triggerEngine.register({
    id: "stanley_game_start",
    listenTo: ["GAME_START"],
    once: true,
    priority: 20,
    conditions: (ctx) => {
      // Sempre executa quando GAME_START é emitido
      return true;
    },
    actions: (ctx) => {
      console.log("veio aqui???");
      // Toca áudio
      audioPlayer.play(`${AUDIO_BASE}/audio_test.wav`, {
        volume: 0.7,
      });

      // Atualiza estado do jogo
      if (ctx.gameState) {
        ctx.gameState.gameStarted = true;
        ctx.gameState.startDate = Date.now();
      }

      // Emite evento de que o jogo começou
      eventBus.emit("GAME_STARTED");
    },
  });

  // Trigger: Usuário navega → Toca áudio
  triggerEngine.register({
    id: "stanley_user_navigate",
    listenTo: ["USER_NAVIGATE"],
    once: false,
    priority: 10,
    conditions: (ctx) => {
      return true;
    },
    actions: (ctx) => {
      // audioPlayer.play(`${AUDIO_BASE}/audio_test.wav`, {
      //   volume: 0.6,
      // });
    },
  });

  // Trigger: Usuário tenta sair → Toca áudio e emite evento
  triggerEngine.register({
    id: "stanley_user_try_exit",
    listenTo: ["USER_TRY_EXIT"],
    once: false,
    priority: 10,
    conditions: (ctx) => {
      // Pode adicionar condições baseadas no estado
      return !ctx.gameState?.labsUnlocked;
    },
    actions: (ctx) => {
      // Toca áudio
      // audioPlayer.play(`${AUDIO_BASE}/audio_test.wav`, {
      //   volume: 0.8,
      // });

      // Emite evento adicional
      eventBus.emit("CLIPPY_INTERRUPT", {
        reason: "EXIT_ATTEMPT",
      });

      // Atualiza estado
      if (ctx.gameState) {
        ctx.gameState.userTriedExitCount =
          (ctx.gameState.userTriedExitCount || 0) + 1;
        ctx.gameState.clippyWaitRequestedAt = Date.now();
      }
    },
  });

  // Trigger: Clippy aparece → Toca áudio
  triggerEngine.register({
    id: "stanley_clippy_appear",
    listenTo: ["CLIPPY_APPEAR"],
    once: false,
    priority: 10,
    conditions: (ctx) => {
      return true;
    },
    actions: (ctx) => {
      // audioPlayer.play(`${AUDIO_BASE}/audio_test.wav`, {
      //   volume: 0.5,
      // });
    },
  });
}

/**
 * Exemplo de trigger com condições complexas:
 *
 * triggerEngine.register({
 *   id: 'stanley_first_click_once',
 *   listenTo: ['USER_CLICK'],
 *   once: true,
 *   priority: 20,
 *   conditions: (ctx) => {
 *     // Só executa se for o primeiro clique
 *     return !ctx.gameState?.firstClickHappened;
 *   },
 *   actions: (ctx) => {
 *     // Toca áudio especial
 *     audioPlayer.play(`${AUDIO_BASE}/first_click.wav`, {
 *       volume: 0.9,
 *     });
 *
 *     // Atualiza estado
 *     if (ctx.gameState) {
 *       ctx.gameState.firstClickHappened = true;
 *     }
 *
 *     // Emite evento
 *     eventBus.emit('CLIPPY_APPEAR');
 *   },
 * });
 */
