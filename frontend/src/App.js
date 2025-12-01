import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { LanguageProvider, useLanguage } from "./contexts/LanguageContext";
import { getTranslation } from "./translations";
import {
  eventBus,
  stanley,
  eventLogger,
  gameLoop,
  achievementManager,
} from "./core";
import { getRouteConfig } from "./core/stanley/getRouteConfig";
import Navigation from "./components/Navigation";
import GameStateDebug from "./components/GameStateDebug";
import StanleyCharacter from "./components/StanleyCharacter";
import ExplosionEffects from "./components/ExplosionEffects";
import CountdownGlobalEffects from "./components/CountdownGlobalEffects";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Help from "./pages/Help";
import Events from "./pages/Events";
import GameStates from "./pages/GameStates";
import Labs from "./pages/Labs";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// Estado inicial do GameState (definido pelo frontend)
const initialGameState = {
  currentScene: "HOME",
  currentPage: "/",
  gamePlayTime: 0, // Tempo de jogo em segundos (atualizado pelo game loop)
  startDate: null,
  gameStarted: false,
  achievements: [],
  lastAction: null,
  lastClickTarget: null,
};

function AppContentInner() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = getTranslation(language);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
  const gameStateRef = React.useRef(null); // Ref para manter o gameState atualizado

  useEffect(() => {
    // Configura o EventLogger para obter o GameState atual
    eventLogger.setGameStateGetter(() => gameStateRef.current);

    // Configura o GameLoop
    gameLoop.setGameStateGetter(() => gameStateRef.current);
    gameLoop.setGameStateUpdater((updates) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return { ...prev, ...updates };
      });
    });

    // Configura o AchievementManager
    achievementManager.setGameStateGetter(() => gameStateRef.current);
    achievementManager.setGameStateUpdater((updates) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return { ...prev, ...updates };
      });
    });

    // Inicializa o logger de eventos
    eventLogger.init();
    // Inicializa GameState (frontend define)
    initializeGameState();
  }, []);

  // Listener para conflito de GameState (quando servidor encontra gamePlayTime maior)
  useEffect(() => {
    const handleGameStateConflict = (event) => {
      const { gameState: serverGameState, error } = event.detail;
      if (serverGameState) {
        console.warn("Conflito de GameState detectado:", error);
        console.log(
          "Aplicando GameState do servidor (com maior playTime):",
          serverGameState
        );

        // Aplica o GameState do servidor (que tem maior playTime)
        setGameState((prev) => {
          const mergedState = { ...initialGameState, ...serverGameState };

          // Sincroniza o gamePlayTime com o GameLoop
          if (mergedState.gamePlayTime !== undefined) {
            gameLoop.syncGamePlayTime(mergedState.gamePlayTime);
          }

          return mergedState;
        });

        // Navega para a página do GameState retornado pelo servidor
        const targetPage = serverGameState.currentPage || "/";
        if (location.pathname !== targetPage) {
          navigate(targetPage, { replace: true });
        }
      }
    };

    window.addEventListener("GAMESTATE_CONFLICT", handleGameStateConflict);
    return () => {
      window.removeEventListener("GAMESTATE_CONFLICT", handleGameStateConflict);
    };
  }, [navigate, location.pathname]);

  // Inicializa Stanley quando gameState carregar (apenas uma vez)
  useEffect(() => {
    if (gameState && !gameState._stanleyInitialized) {
      stanley.init(gameState);
      // Marca como inicializado para evitar duplicação
      setGameState((prev) => ({ ...prev, _stanleyInitialized: true }));
    }
  }, [gameState]);

  // Atualiza Stanley quando gameState mudar
  useEffect(() => {
    if (gameState) {
      stanley.updateGameState(gameState);
      // Atualiza a ref para o game loop
      gameStateRef.current = gameState;
    }
  }, [gameState]);

  // Inicia/para o GameLoop baseado no estado do jogo
  useEffect(() => {
    if (gameState && !loading && gameState.gameStarted) {
      // Sincroniza o gamePlayTime se existir
      if (gameState.gamePlayTime !== undefined) {
        gameLoop.syncGamePlayTime(gameState.gamePlayTime);
      }
      gameLoop.start();
    } else {
      gameLoop.stop();
    }

    return () => {
      gameLoop.stop();
    };
  }, [gameState?.gameStarted, loading]);

  // Redireciona para a rota correta baseado no GameState (apenas uma vez após carregar)
  useEffect(() => {
    if (gameState && !loading && !hasRedirected) {
      const expectedPage = gameState.currentPage || "/";
      const currentPath = location.pathname;

      // Se a rota atual não corresponde à rota do GameState, redireciona
      if (currentPath !== expectedPage) {
        console.log(
          `Redirecionando de ${currentPath} para ${expectedPage} (baseado no GameState)`
        );
        setHasRedirected(true);
        navigate(expectedPage, { replace: true });
      } else {
        // Já está na rota correta, marca como redirecionado
        setHasRedirected(true);
      }
    }
  }, [gameState, loading, location.pathname, navigate, hasRedirected]);

  // Listener para eventos que atualizam o GameState
  useEffect(() => {
    // Listener para navegação
    const handleNavigate = (event) => {
      const path = event.payload?.path || "/";
      const pageName =
        path === "/" ? "HOME" : path.toUpperCase().replace("/", "");

      updateGameState({
        currentScene: pageName,
        currentPage: path,
        lastAction: "NAVIGATE",
      });

      // Adiciona achievement cumulativo baseado na configuração de rotas
      const routeConfig = getRouteConfig(path);
      if (routeConfig && routeConfig.achievementBase) {
        achievementManager.addCumulativeAchievement(
          routeConfig.achievementBase,
          routeConfig.maxAchievements || 10
        );
      }
    };

    // Listener para cliques
    const handleClick = (event) => {
      // Atualiza apenas localmente - o backend vai validar o playtime e retornar o GameState correto
      updateGameState({
        lastAction: "CLICK",
        lastClickTarget: event.payload?.id || null,
      });
    };

    // Listener para GAME_START
    const handleGameStart = (event) => {
      // Adiciona o achievement "game_start"
      achievementManager.addAchievement("game_start");

      updateGameState({
        gameStarted: true,
        startDate: Date.now(),
        currentScene: "HOME",
        currentPage: "/",
        lastAction: "GAME_START",
      });
    };

    // Registra listeners
    eventBus.on("USER_NAVIGATE", handleNavigate);
    eventBus.on("USER_CLICK", handleClick);
    eventBus.on("GAME_START", handleGameStart);

    return () => {
      eventBus.off("USER_NAVIGATE", handleNavigate);
      eventBus.off("USER_CLICK", handleClick);
      eventBus.off("GAME_START", handleGameStart);
    };
  }, []);

  // Atualiza GameState quando a rota muda (React Router)
  useEffect(() => {
    if (gameState && location) {
      const path = location.pathname;
      const pageName =
        path === "/"
          ? "HOME"
          : path.toUpperCase().replace("/", "").replace("-", "_");

      // Só atualiza se a página realmente mudou
      if (gameState.currentPage !== path) {
        updateGameState({
          currentScene: pageName,
          currentPage: path,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Inicializa GameState (frontend define)
  const initializeGameState = async () => {
    try {
      // Verifica se tem sessionId no localStorage
      const sessionId = localStorage.getItem("portfolio_session_id");

      if (sessionId) {
        // Tenta carregar GameState da sessão do backend
        const url = `${API_BASE}/gamestate?sessionId=${sessionId}`;
        const response = await fetch(url);

        if (response.ok) {
          const savedState = await response.json();
          // Se o backend retornou um estado salvo, usa ele
          // Caso contrário (null), usa estado inicial
          if (savedState && Object.keys(savedState).length > 0) {
            const state = { ...initialGameState, ...savedState };
            // Sincroniza o gamePlayTime com o GameLoop
            if (state.gamePlayTime !== undefined) {
              gameLoop.syncGamePlayTime(state.gamePlayTime);
            }
            setGameState(state);
            setLoading(false);
            return;
          }
        } else {
          // Sessão não existe mais, remove do localStorage
          console.warn("Sessão não encontrada, removendo do localStorage");
          localStorage.removeItem("portfolio_session_id");
        }
      }

      // Se não tem sessão ou sessão não existe, usa estado inicial (frontend define)
      const initialState = { ...initialGameState };
      setGameState(initialState);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao inicializar GameState:", error);
      // Em caso de erro, usa estado inicial (frontend define)
      const initialState = { ...initialGameState };
      setGameState(initialState);
      setLoading(false);
    }
  };

  // Atualiza GameState localmente (frontend define)
  // O GameState será enviado automaticamente quando houver um evento (via EventLogger)
  // O backend valida e retorna o GameState corrigido
  const updateGameState = (updates) => {
    setGameState((prev) => {
      if (!prev) {
        const newState = { ...initialGameState, ...updates };
        // Atualiza a ref imediatamente para que EventLogger pegue o estado atualizado
        gameStateRef.current = newState;
        return newState;
      }

      // Apenas atualiza localmente - o backend vai validar e retornar o valor correto
      const newState = {
        ...prev,
        ...updates,
      };
      // Atualiza a ref imediatamente para que EventLogger pegue o estado atualizado
      gameStateRef.current = newState;
      return newState;
    });
  };

  // Recarrega GameState do servidor e navega para o último estado válido
  const reloadGameStateFromServer = async () => {
    try {
      const sessionId = localStorage.getItem("portfolio_session_id");

      if (sessionId) {
        const url = `${API_BASE}/gamestate?sessionId=${sessionId}`;
        const response = await fetch(url);

        if (response.ok) {
          const serverState = await response.json();
          if (serverState && Object.keys(serverState).length > 0) {
            // Mescla com estado inicial mantendo valores válidos
            const validState = { ...initialGameState, ...serverState };
            setGameState(validState);

            // Navega para a página do último estado válido
            const targetPage = validState.currentPage || "/";
            if (location.pathname !== targetPage) {
              navigate(targetPage, { replace: true });
            }

            console.log(
              "GameState recarregado do servidor e navegação atualizada."
            );
            return;
          }
        }
      }

      // Se não conseguiu carregar, mantém o estado atual
      console.warn("Não foi possível recarregar GameState do servidor.");
    } catch (error) {
      console.error("Erro ao recarregar GameState do servidor:", error);
    }
  };

  // Sincroniza GameState com backend (apenas persiste)
  // NOTA: Esta função não é mais usada
  // O GameState agora é enviado automaticamente através dos eventos (EventLogger)
  // O POST do eventlog já inclui o GameState atual
  const syncGameStateToBackend = async (state) => {
    // Função mantida para compatibilidade, mas não é mais chamada
    // O GameState é enviado automaticamente com cada evento via EventLogger
  };

  const logEvent = async (event) => {
    try {
      await fetch(`${API_BASE}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error("Erro ao logar evento:", error);
    }
  };

  // Router sempre renderizado para preservar a rota atual
  // O conteúdo interno mostra loading enquanto carrega o GameState
  return (
    <div className="App">
      {loading ? (
        <div className="App-loading">{t.common.loading}</div>
      ) : (
        <>
          <Navigation />
          <main className="App-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/help" element={<Help />} />
              <Route path="/events" element={<Events />} />
              <Route path="/gamestates" element={<GameStates />} />
              <Route path="/labs" element={<Labs />} />
            </Routes>
          </main>
          <footer className="App-footer">
            <p>&copy; 2024 Portfolio. {t.common.footer}</p>
          </footer>
        </>
      )}
      {/* Stanley Character - Narrador visual */}
      {gameState && <StanleyCharacter />}
      {/* Debug sempre visível quando houver gameState */}
      {gameState && <GameStateDebug gameState={gameState} />}
      {/* Explosões globais - funcionam em todas as páginas */}
      <ExplosionEffects />
      {/* Countdown global - shake, overlay vermelho e timer em todas as páginas */}
      <CountdownGlobalEffects />
    </div>
  );
}

function AppContent() {
  return (
    <Router>
      <AppContentInner />
    </Router>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;
