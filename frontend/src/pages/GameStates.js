import React, { useState, useEffect } from "react";
import "./Page.css";
import "./GameStates.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

function GameStates() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);
  const [selectedSession, setSelectedSession] = useState(null);

  useEffect(() => {
    loadSessions();
  }, [limit]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/sessions?limit=${limit}`);
      const data = await response.json();
      setSessions(data.sessions || []);
      setLoading(false);
    } catch (error) {
      console.error("Erro ao carregar sessões:", error);
      setLoading(false);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "N/A";
    const date = new Date(ts);
    return date.toLocaleString("pt-BR");
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime) return "N/A";
    const end = endTime || Date.now();
    const duration = end - startTime;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getCurrentSessionId = () => {
    return localStorage.getItem("portfolio_session_id");
  };

  if (loading) {
    return (
      <div className="Page">
        <h1>GameStates</h1>
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="Page">
      <h1>GameStates - Todas as Sessões</h1>
      
      <div className="GameStates-controls">
        <label>
          Limite:{" "}
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value) || 50)}
            min="1"
            max="500"
          />
        </label>
        <button onClick={loadSessions}>Recarregar</button>
      </div>

      <div className="GameStates-stats">
        <p>Total de sessões: {sessions.length}</p>
        <p>Sessão atual: {getCurrentSessionId() || "Nenhuma"}</p>
      </div>

      <div className="GameStates-container">
        <div className="GameStates-list">
          <h2>Sessões ({sessions.length})</h2>
          <div className="GameStates-sessions">
            {sessions.map((session) => {
              const isActive = !session.endTime;
              const isCurrent = session.sessionId === getCurrentSessionId();
              
              return (
                <div
                  key={session.sessionId}
                  className={`GameStates-session ${isActive ? "active" : ""} ${isCurrent ? "current" : ""}`}
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="GameStates-session-header">
                    <span className="GameStates-session-id">
                      {session.sessionId}
                      {isCurrent && " (Atual)"}
                      {isActive && " (Ativa)"}
                    </span>
                  </div>
                  <div className="GameStates-session-info">
                    <div>
                      <strong>Início:</strong> {formatTimestamp(session.startTime)}
                    </div>
                    <div>
                      <strong>Fim:</strong> {formatTimestamp(session.endTime)}
                    </div>
                    <div>
                      <strong>Duração:</strong> {formatDuration(session.startTime, session.endTime)}
                    </div>
                    <div>
                      <strong>Scene:</strong> {session.gameState?.currentScene || "N/A"}
                    </div>
                    <div>
                      <strong>Página:</strong> {session.gameState?.currentPage || "N/A"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="GameStates-detail">
          <h2>GameState Detalhado</h2>
          {selectedSession ? (
            <div>
              <div className="GameStates-detail-header">
                <h3>Session ID: {selectedSession.sessionId}</h3>
                <button onClick={() => setSelectedSession(null)}>Fechar</button>
              </div>
              <div className="GameStates-detail-info">
                <div>
                  <strong>ID:</strong> {selectedSession.id}
                </div>
                <div>
                  <strong>Início:</strong> {formatTimestamp(selectedSession.startTime)}
                </div>
                <div>
                  <strong>Fim:</strong> {formatTimestamp(selectedSession.endTime)}
                </div>
                <div>
                  <strong>Duração:</strong> {formatDuration(selectedSession.startTime, selectedSession.endTime)}
                </div>
                <div>
                  <strong>Criado em:</strong> {formatTimestamp(selectedSession.createdAt)}
                </div>
              </div>
              <div className="GameStates-detail-gamestate">
                <h4>GameState:</h4>
                <pre className="GameStates-json">
                  {JSON.stringify(selectedSession.gameState, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p>Selecione uma sessão para ver os detalhes do GameState</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default GameStates;

