import React, { useState } from "react";
import "./GameStateDebug.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

function GameStateDebug({ gameState }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  if (!gameState) {
    return null;
  }

  const handleResetDatabase = async () => {
    if (!window.confirm("Tem certeza que deseja resetar o banco de dados? Isso irá deletar TODAS as sessões, eventos e game states!")) {
      return;
    }

    if (!window.confirm("Esta ação é IRREVERSÍVEL. Continuar?")) {
      return;
    }

    try {
      setIsResetting(true);
      const response = await fetch(`${API_BASE}/database/reset`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao resetar banco de dados");
      }

      const result = await response.json();
      alert(`Banco de dados resetado com sucesso!\n\nEventos deletados: ${result.eventsDeleted}\nGame States deletados: ${result.gameStatesDeleted}\nSessões deletadas: ${result.sessionsDeleted}\n\nTotal: ${result.total} registros`);
      
      // Limpa o localStorage também
      localStorage.removeItem("portfolio_session_id");
      
      // Recarrega a página para aplicar o reset
      window.location.reload();
    } catch (error) {
      console.error("Erro ao resetar banco de dados:", error);
      alert(`Erro ao resetar banco de dados: ${error.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className={`GameStateDebug ${isOpen ? "open" : "closed"} ${isMinimized ? "minimized" : ""}`}>
      <div className="GameStateDebug-header">
        <span className="GameStateDebug-title">GameState Debug</span>
        <div className="GameStateDebug-controls">
          {!isMinimized && (
            <button
              className="GameStateDebug-btn GameStateDebug-btn-danger"
              onClick={handleResetDatabase}
              title="Resetar Banco de Dados"
              disabled={isResetting}
              style={{ fontSize: "12px", width: "auto", padding: "0 8px" }}
            >
              {isResetting ? "..." : "🗑️ Reset DB"}
            </button>
          )}
          <button
            className="GameStateDebug-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expandir" : "Minimizar"}
          >
            {isMinimized ? "□" : "−"}
          </button>
          <button
            className="GameStateDebug-btn"
            onClick={() => setIsOpen(false)}
            title="Fechar"
          >
            ×
          </button>
        </div>
      </div>
      {!isMinimized && (
        <div className="GameStateDebug-content">
          <div className="GameStateDebug-session">
            <span className="GameStateDebug-label">Session ID:</span>
            <span className="GameStateDebug-sessionId">
              {localStorage.getItem("portfolio_session_id") || "N/A"}
            </span>
          </div>
          <pre className="GameStateDebug-json">
            {JSON.stringify(gameState, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default GameStateDebug;

