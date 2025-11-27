import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs/promises";
import fsSync from "fs";
import {
  insertEvent,
  getEvents,
  countEventsByName,
  deleteAllEvents,
  createSession,
  getActiveSession,
  getSessionById,
  endSession,
  updateSessionGameState,
  getAllSessions,
  insertGameState,
  getLatestGameState,
  getGameStatesBySession,
  resetDatabase,
  findGameStateWithGreaterPlayTime,
} from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PORT = process.env.PORT || 3001;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir frontend em produção (apenas se o diretório existir)
const frontendPath = join(__dirname, "../frontend/build");
let frontendBuildExists = false;

if (fsSync.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
  frontendBuildExists = true;
  console.log("Frontend build encontrado, servindo arquivos estáticos");
} else {
  console.log(
    "Frontend build não encontrado, servidor rodando apenas em modo API"
  );
}

// Caminho para armazenar dados
const dataDir = join(__dirname, "data");
const gameStatePath = join(dataDir, "gameState.json");
const eventLogPath = join(dataDir, "eventLog.json");

// Garantir que o diretório data existe
await fs.mkdir(dataDir, { recursive: true });

// Estado inicial do GameState
const initialGameState = {
  currentScene: "HOME",
  gamePlayTime: 0,
  startDate: null,
  achievements: [],
};

// Ler GameState - busca o último GameState da sessão (backend apenas persiste, frontend define)
async function getGameState(sessionId = null) {
  try {
    let activeSessionId = sessionId;

    // Se não tem sessionId, tenta pegar a sessão ativa
    if (!activeSessionId) {
      const activeSession = getActiveSession();
      activeSessionId = activeSession?.sessionId || null;
    }

    if (activeSessionId) {
      // Busca o último GameState da sessão
      const latestGameState = getLatestGameState(activeSessionId);
      if (latestGameState) {
        return latestGameState.gameState;
      }

      // Se não tem GameState na tabela, tenta pegar da sessão (compatibilidade)
      const session = getSessionById(activeSessionId);
      if (session && session.gameState) {
        return session.gameState;
      }
    }

    // Se não tem sessão, retorna null (frontend vai criar estado inicial)
    return null;
  } catch (error) {
    console.error("Erro ao buscar GameState:", error);
    return null;
  }
}

// Salvar GameState - cria um novo registro no histórico (sempre pega o último)
async function saveGameState(state, sessionId = null) {
  // Remove campos internos antes de salvar
  const { sessionId: _, ...stateToSave } = state;

  let activeSessionId = sessionId;

  // Se não tem sessionId, tenta pegar a sessão ativa
  if (!activeSessionId) {
    const activeSession = getActiveSession();
    activeSessionId = activeSession?.sessionId || null;
  }

  if (activeSessionId) {
    // Insere um novo GameState no histórico
    insertGameState(activeSessionId, stateToSave);

    // Também atualiza na sessão (para compatibilidade)
    updateSessionGameState(activeSessionId, stateToSave);
  } else {
    // Se não tem sessão, apenas loga (frontend deve criar sessão primeiro)
    console.warn("Tentativa de salvar GameState sem sessão ativa");
  }
}

// Adicionar evento ao banco SQLite e validar gamePlayTime
async function addEvent(event) {
  try {
    const eventName = event.event || event.name;
    const payload = event.payload || null;
    const timestamp = event.ts || event.timestamp || Date.now();
    let sessionId = event.sessionId || null;
    const gamePlayTime = event.gamePlayTime || 0;
    const gameState = event.gameState || null; // Recebe o gameState completo

    // Se for GAME_START, cria uma nova sessão com GameState inicial
    if (eventName === "GAME_START") {
      const newGameState = {
        ...initialGameState,
        currentScene: "HOME",
        gamePlayTime: 0,
        startDate: timestamp,
        achievements: [],
      };
      const newSessionId = createSession(null, newGameState);
      // Cria o primeiro GameState
      insertGameState(newSessionId, newGameState);
      const id = insertEvent(eventName, payload, timestamp, newSessionId);
      return {
        success: true,
        id,
        sessionId: newSessionId,
        gameState: newGameState, // Retorna o GameState inicial
      };
    }

    // Se não tem sessionId, tenta pegar a sessão ativa
    if (!sessionId) {
      const activeSession = getActiveSession();
      sessionId = activeSession?.sessionId || null;
    }

    if (!sessionId) {
      throw new Error("Sessão não encontrada");
    }

    // Verifica se existe algum GameState com gamePlayTime maior que o enviado
    const greaterGameState = findGameStateWithGreaterPlayTime(
      sessionId,
      gamePlayTime
    );

    if (greaterGameState) {
      // Existe um GameState com playtime maior - retorna erro
      const id = insertEvent(eventName, payload, timestamp, sessionId);
      throw {
        status: 409,
        message: "Conflito: existe um GameState com gamePlayTime maior",
        gameState: greaterGameState.gameState,
        id,
        sessionId,
      };
    }

    // Não existe GameState maior - aceita e salva
    // Usa o gameState enviado pelo frontend, ou mescla com o último se não enviou
    const latestGameState = getLatestGameState(sessionId);
    const updatedGameState = gameState
      ? {
          ...gameState,
          gamePlayTime: gamePlayTime, // Garante que usa o gamePlayTime correto
        }
      : latestGameState
      ? {
          ...latestGameState.gameState,
          gamePlayTime: gamePlayTime,
        }
      : {
          ...initialGameState,
          gamePlayTime: gamePlayTime,
        };

    // Salva o novo GameState
    insertGameState(sessionId, updatedGameState);

    const id = insertEvent(eventName, payload, timestamp, sessionId);
    return {
      success: true,
      id,
      sessionId,
      // Não retorna gameState - apenas success
    };
  } catch (error) {
    console.error("Erro ao salvar evento:", error);
    throw error;
  }
}

// Rotas da API

// GET /api/gamestate - Obter estado do jogo (da sessão atual)
app.get("/api/gamestate", async (req, res) => {
  try {
    const sessionId = req.query.sessionId || null;
    const state = await getGameState(sessionId);
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/gamestate - Salvar estado do jogo (na sessão atual)
app.post("/api/gamestate", async (req, res) => {
  try {
    const state = req.body;
    const sessionId = req.body.sessionId || null;
    await saveGameState(state, sessionId);
    res.json(state);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events - Obter log de eventos do SQLite
app.get("/api/events", async (req, res) => {
  try {
    const filters = {
      eventName: req.query.event,
      sessionId: req.query.sessionId,
      startTime: req.query.startTime ? parseInt(req.query.startTime) : null,
      endTime: req.query.endTime ? parseInt(req.query.endTime) : null,
      limit: req.query.limit ? parseInt(req.query.limit) : 100, // Default 100 eventos
    };

    const events = getEvents(filters);
    res.json({
      count: events.length,
      events: events,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sessions - Obter todas as sessões (com GameStates)
app.get("/api/sessions", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const sessions = getAllSessions(limit);
    res.json({
      count: sessions.length,
      sessions: sessions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sessions/active - Obter sessão ativa
app.get("/api/sessions/active", async (req, res) => {
  try {
    const activeSession = getActiveSession();
    res.json({ activeSession });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/gamestates/:sessionId - Obter todos os GameStates de uma sessão
app.get("/api/gamestates/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const gameStates = getGameStatesBySession(sessionId, limit);
    res.json({
      count: gameStates.length,
      sessionId: sessionId,
      gameStates: gameStates,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/gamestates/:sessionId/latest - Obter o último GameState de uma sessão
app.get("/api/gamestates/:sessionId/latest", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const latestGameState = getLatestGameState(sessionId);
    if (latestGameState) {
      res.json(latestGameState);
    } else {
      res.status(404).json({ error: "GameState não encontrado" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sessions - Criar nova sessão
app.post("/api/sessions", async (req, res) => {
  try {
    const sessionId = createSession();
    res.json({ success: true, sessionId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/sessions/:sessionId - Finalizar sessão
app.delete("/api/sessions/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const success = endSession(sessionId);
    res.json({ success, sessionId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/stats - Estatísticas dos eventos
app.get("/api/events/stats", async (req, res) => {
  try {
    // Lista de eventos conhecidos para contar
    const knownEvents = [
      "GAME_START",
      "GAME_STARTED",
      "USER_CLICK",
      "USER_NAVIGATE",
      "USER_TRY_EXIT",
      "CLIPPY_APPEAR",
      "CLIPPY_INTERRUPT",
      "NAVIGATE",
      "NAVIGATE_OVERRIDE",
    ];

    const stats = {};
    for (const eventName of knownEvents) {
      stats[eventName] = countEventsByName(eventName);
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/events - Adicionar evento ao banco SQLite
app.post("/api/events", async (req, res) => {
  try {
    const event = req.body;
    const result = await addEvent(event);
    // Retorna apenas success se tudo OK
    res.json(result);
  } catch (error) {
    console.error("Erro ao processar evento:", error);

    // Se for erro de conflito (409), retorna com status 409
    if (error.status === 409) {
      return res.status(409).json({
        error: error.message,
        gameState: error.gameState,
        id: error.id,
        sessionId: error.sessionId,
      });
    }

    // Outros erros retornam 500
    res
      .status(500)
      .json({ error: error.message || "Erro ao processar evento" });
  }
});

// DELETE /api/events - Deletar todos os eventos
app.delete("/api/events", async (req, res) => {
  try {
    const deletedCount = deleteAllEvents();
    res.json({
      success: true,
      message: `Deleted ${deletedCount} events`,
      deletedCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/database/reset - Reseta completamente o banco de dados
app.delete("/api/database/reset", async (req, res) => {
  try {
    const result = resetDatabase();
    res.json({
      success: true,
      message: "Banco de dados resetado com sucesso",
      ...result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback: servir index.html do React para todas as rotas não-API (apenas se o build existir)
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    if (frontendBuildExists) {
      res.sendFile(join(frontendPath, "index.html"));
    } else {
      res.status(404).json({
        error:
          "Frontend não compilado. Execute 'npm run build' no diretório frontend.",
        path: req.path,
      });
    }
  } else {
    res.status(404).json({ error: "Rota não encontrada" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
