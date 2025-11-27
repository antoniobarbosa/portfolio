import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dataDir = join(__dirname, 'data');
const dbPath = join(dataDir, 'portfolio.db');

// Garante que o diretório data existe
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Cria conexão com o banco
const db = new Database(dbPath);

// Cria tabela de sessões se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    start_time INTEGER NOT NULL,
    end_time INTEGER,
    game_state TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migração: adiciona coluna game_state se não existir
try {
  db.exec(`ALTER TABLE sessions ADD COLUMN game_state TEXT`);
} catch (error) {
  // Coluna já existe, ignora o erro
  if (!error.message.includes('duplicate column name')) {
    console.warn('Erro ao adicionar coluna game_state:', error.message);
  }
}

// Cria tabela de game_states (histórico de GameStates por sessão)
db.exec(`
  CREATE TABLE IF NOT EXISTS game_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    game_state TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(session_id)
  )
`);

// Cria índices para melhor performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_game_states_session_id ON game_states(session_id);
  CREATE INDEX IF NOT EXISTS idx_game_states_timestamp ON game_states(timestamp);
`);

// Cria tabela de eventos se não existir
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    event_name TEXT NOT NULL,
    payload TEXT,
    timestamp INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migração: adiciona coluna session_id se não existir
try {
  db.exec(`ALTER TABLE events ADD COLUMN session_id TEXT`);
} catch (error) {
  // Coluna já existe, ignora o erro
  if (!error.message.includes('duplicate column name')) {
    console.warn('Erro ao adicionar coluna session_id:', error.message);
  }
}

// Cria índices para melhor performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_event_name ON events(event_name);
  CREATE INDEX IF NOT EXISTS idx_timestamp ON events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_session_id ON events(session_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_id ON sessions(session_id);
`);

/**
 * Cria uma nova sessão
 */
export function createSession(sessionId = null, gameState = null) {
  const id = sessionId || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  const gameStateStr = gameState ? JSON.stringify(gameState) : null;
  
  const stmt = db.prepare(`
    INSERT INTO sessions (session_id, start_time, game_state)
    VALUES (?, ?, ?)
  `);
  
  stmt.run(id, startTime, gameStateStr);
  return id;
}

/**
 * Obtém a sessão ativa mais recente
 */
export function getActiveSession() {
  const stmt = db.prepare(`
    SELECT * FROM sessions 
    WHERE end_time IS NULL 
    ORDER BY start_time DESC 
    LIMIT 1
  `);
  
  const row = stmt.get();
  return row ? {
    id: row.id,
    sessionId: row.session_id,
    startTime: row.start_time,
    endTime: row.end_time,
    gameState: row.game_state ? JSON.parse(row.game_state) : null,
    createdAt: row.created_at,
  } : null;
}

/**
 * Obtém uma sessão por ID
 */
export function getSessionById(sessionId) {
  const stmt = db.prepare(`
    SELECT * FROM sessions 
    WHERE session_id = ?
  `);
  
  const row = stmt.get(sessionId);
  return row ? {
    id: row.id,
    sessionId: row.session_id,
    startTime: row.start_time,
    endTime: row.end_time,
    gameState: row.game_state ? JSON.parse(row.game_state) : null,
    createdAt: row.created_at,
  } : null;
}

/**
 * Atualiza o GameState de uma sessão
 */
export function updateSessionGameState(sessionId, gameState) {
  const gameStateStr = gameState ? JSON.stringify(gameState) : null;
  const stmt = db.prepare(`
    UPDATE sessions 
    SET game_state = ? 
    WHERE session_id = ?
  `);
  
  const result = stmt.run(gameStateStr, sessionId);
  return result.changes > 0;
}

/**
 * Finaliza uma sessão
 */
export function endSession(sessionId) {
  const stmt = db.prepare(`
    UPDATE sessions 
    SET end_time = ? 
    WHERE session_id = ? AND end_time IS NULL
  `);
  
  const result = stmt.run(Date.now(), sessionId);
  return result.changes > 0;
}

/**
 * Lista todas as sessões
 */
export function getAllSessions(limit = 100) {
  const stmt = db.prepare(`
    SELECT * FROM sessions 
    ORDER BY start_time DESC 
    LIMIT ?
  `);
  
  const rows = stmt.all(limit);
  return rows.map(row => ({
    id: row.id,
    sessionId: row.session_id,
    startTime: row.start_time,
    endTime: row.end_time,
    gameState: row.game_state ? JSON.parse(row.game_state) : null,
    createdAt: row.created_at,
  }));
}

/**
 * Insere um evento no banco (associado a uma sessão se houver)
 */
export function insertEvent(eventName, payload = null, timestamp = null, sessionId = null) {
  // Se não tem sessionId, tenta pegar a sessão ativa
  let activeSessionId = sessionId;
  if (!activeSessionId) {
    const activeSession = getActiveSession();
    activeSessionId = activeSession?.sessionId || null;
  }
  
  const stmt = db.prepare(`
    INSERT INTO events (session_id, event_name, payload, timestamp)
    VALUES (?, ?, ?, ?)
  `);
  
  const ts = timestamp || Date.now();
  const payloadStr = payload ? JSON.stringify(payload) : null;
  
  const result = stmt.run(activeSessionId, eventName, payloadStr, ts);
  return result.lastInsertRowid;
}

/**
 * Busca eventos
 */
export function getEvents(filters = {}) {
  let query = 'SELECT * FROM events WHERE 1=1';
  const params = [];
  
  if (filters.eventName) {
    query += ' AND event_name = ?';
    params.push(filters.eventName);
  }
  
  if (filters.sessionId) {
    query += ' AND session_id = ?';
    params.push(filters.sessionId);
  }
  
  if (filters.startTime) {
    query += ' AND timestamp >= ?';
    params.push(filters.startTime);
  }
  
  if (filters.endTime) {
    query += ' AND timestamp <= ?';
    params.push(filters.endTime);
  }
  
  query += ' ORDER BY timestamp DESC';
  
  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }
  
  const stmt = db.prepare(query);
  const rows = stmt.all(...params);
  
  // Parse payload JSON
  return rows.map(row => ({
    id: row.id,
    sessionId: row.session_id,
    event: row.event_name,
    payload: row.payload ? JSON.parse(row.payload) : null,
    ts: row.timestamp,
    createdAt: row.created_at,
  }));
}

/**
 * Conta eventos por nome
 */
export function countEventsByName(eventName) {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM events WHERE event_name = ?');
  const result = stmt.get(eventName);
  return result.count;
}

/**
 * Deleta todos os eventos
 */
export function deleteAllEvents() {
  const stmt = db.prepare('DELETE FROM events');
  const result = stmt.run();
  return result.changes; // Retorna número de linhas deletadas
}

/**
 * Insere um novo GameState (cria histórico)
 */
export function insertGameState(sessionId, gameState) {
  const gameStateStr = JSON.stringify(gameState);
  const timestamp = Date.now();
  
  const stmt = db.prepare(`
    INSERT INTO game_states (session_id, game_state, timestamp)
    VALUES (?, ?, ?)
  `);
  
  const result = stmt.run(sessionId, gameStateStr, timestamp);
  return result.lastInsertRowid;
}

/**
 * Obtém o último GameState de uma sessão
 */
export function getLatestGameState(sessionId) {
  const stmt = db.prepare(`
    SELECT * FROM game_states 
    WHERE session_id = ? 
    ORDER BY timestamp DESC 
    LIMIT 1
  `);
  
  const row = stmt.get(sessionId);
  return row ? {
    id: row.id,
    sessionId: row.session_id,
    gameState: JSON.parse(row.game_state),
    timestamp: row.timestamp,
    createdAt: row.created_at,
  } : null;
}

/**
 * Lista todos os GameStates de uma sessão
 */
export function getGameStatesBySession(sessionId, limit = 100) {
  const stmt = db.prepare(`
    SELECT * FROM game_states 
    WHERE session_id = ? 
    ORDER BY timestamp DESC 
    LIMIT ?
  `);
  
  const rows = stmt.all(sessionId, limit);
  return rows.map(row => ({
    id: row.id,
    sessionId: row.session_id,
    gameState: JSON.parse(row.game_state),
    timestamp: row.timestamp,
    createdAt: row.created_at,
  }));
}

/**
 * Verifica se existe algum GameState com gamePlayTime maior que o informado
 * Retorna o GameState com maior gamePlayTime se existir
 */
export function findGameStateWithGreaterPlayTime(sessionId, gamePlayTime) {
  const stmt = db.prepare(`
    SELECT * FROM game_states 
    WHERE session_id = ? 
    ORDER BY timestamp DESC
  `);
  
  const rows = stmt.all(sessionId);
  
  // Procura o GameState com maior gamePlayTime
  let maxGameState = null;
  let maxPlayTime = gamePlayTime;
  
  for (const row of rows) {
    const gameState = JSON.parse(row.game_state);
    const playTime = gameState.gamePlayTime || 0;
    
    if (playTime > maxPlayTime) {
      maxPlayTime = playTime;
      maxGameState = {
        id: row.id,
        sessionId: row.session_id,
        gameState: gameState,
        timestamp: row.timestamp,
        createdAt: row.created_at,
      };
    }
  }
  
  return maxGameState; // Retorna null se não encontrar nenhum maior
}

/**
 * Reseta completamente o banco de dados (limpa todas as tabelas)
 */
export function resetDatabase() {
  const transaction = db.transaction(() => {
    // Deleta todos os dados das tabelas (mantém a estrutura)
    const deleteEvents = db.prepare('DELETE FROM events');
    const deleteGameStates = db.prepare('DELETE FROM game_states');
    const deleteSessions = db.prepare('DELETE FROM sessions');
    
    const eventsDeleted = deleteEvents.run().changes;
    const gameStatesDeleted = deleteGameStates.run().changes;
    const sessionsDeleted = deleteSessions.run().changes;
    
    return {
      eventsDeleted,
      gameStatesDeleted,
      sessionsDeleted,
      total: eventsDeleted + gameStatesDeleted + sessionsDeleted,
    };
  });
  
  return transaction();
}

export default db;

