import { loadRoutesConfig } from "./loadRoutesConfig";

/**
 * Registra todos os triggers do Stanley
 * Agora usa configuração de arquivo JSON para facilitar manutenção
 */
export function registerStanleyTriggers() {
  // Carrega triggers baseados na configuração de rotas
  loadRoutesConfig();
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
