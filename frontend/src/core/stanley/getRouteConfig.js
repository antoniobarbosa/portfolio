import routesConfig from './routes-config.json';

/**
 * Obtém a configuração de uma rota específica
 * @param {string} path - Caminho da rota (ex: "/about")
 * @returns {object|null} - Configuração da rota ou null se não encontrada
 */
export function getRouteConfig(path) {
  return routesConfig.routes?.find(route => route.path === path) || null;
}

/**
 * Obtém todas as rotas configuradas
 * @returns {Array}
 */
export function getAllRoutesConfig() {
  return routesConfig.routes || [];
}

export default routesConfig;

