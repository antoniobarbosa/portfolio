import React, { useState, useEffect } from "react";
import "./GameStateDebug.css";
import { audioPlayer } from "../core";
import { stanleyStateManager, STANLEY_STATES } from "./StanleyCharacter";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

function GameStateDebug({ gameState }) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [clientIp, setClientIp] = useState(null);
  const [audioState, setAudioState] = useState(null);
  const [stanleyState, setStanleyState] = useState(STANLEY_STATES.IDLE);

  // Busca o IP da sessão atual (apenas uma vez quando o componente monta)
  useEffect(() => {
    const fetchSessionIp = async () => {
      const sessionId = localStorage.getItem("portfolio_session_id");
      if (!sessionId) {
        setClientIp(null);
        return;
      }

      try {
        // Busca apenas a sessão específica ao invés de todas as sessões
        const response = await fetch(`${API_BASE}/sessions/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.session?.clientIp) {
            setClientIp(data.session.clientIp);
          } else {
            setClientIp(null);
          }
        } else if (response.status === 404) {
          // Sessão não encontrada
          setClientIp(null);
        }
      } catch (error) {
        console.error("Erro ao buscar IP da sessão:", error);
        setClientIp(null);
      }
    };

    fetchSessionIp();
    // Só busca uma vez quando o componente monta - o IP não muda durante a sessão
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Atualiza o estado do áudio periodicamente
  useEffect(() => {
    const updateAudioState = () => {
      const state = audioPlayer.getAudioState();
      setAudioState(state);
    };

    // Atualiza imediatamente
    updateAudioState();

    // Atualiza a cada segundo
    const interval = setInterval(updateAudioState, 1000);

    return () => clearInterval(interval);
  }, []);

  // Escuta mudanças de estado do Stanley
  useEffect(() => {
    const unsubscribe = stanleyStateManager.subscribe((newState) => {
      setStanleyState(newState);
    });
    return unsubscribe;
  }, []);

  // Função para mudar estado do Stanley
  const handleStanleyStateChange = (newState) => {
    stanleyStateManager.setState(newState);
  };

  if (!gameState) {
    return null;
  }

  const handleResetDatabase = async () => {
    if (
      !window.confirm(
        "Tem certeza que deseja resetar o banco de dados? Isso irá deletar TODAS as sessões, eventos e game states!"
      )
    ) {
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
      alert(
        `Banco de dados resetado com sucesso!\n\nEventos deletados: ${result.eventsDeleted}\nGame States deletados: ${result.gameStatesDeleted}\nSessões deletadas: ${result.sessionsDeleted}\n\nTotal: ${result.total} registros`
      );

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
    <div
      className={`GameStateDebug ${isOpen ? "open" : "closed"} ${
        isMinimized ? "minimized" : ""
      }`}
    >
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
          {clientIp && (
            <div className="GameStateDebug-session">
              <span className="GameStateDebug-label">Client IP:</span>
              <span className="GameStateDebug-sessionId">{clientIp}</span>
            </div>
          )}
          {audioState && (
            <div className="GameStateDebug-audio">
              <div className="GameStateDebug-audio-header">
                <span className="GameStateDebug-label">Audio State:</span>
              </div>
              <div className="GameStateDebug-audio-info">
                <div className="GameStateDebug-audio-item">
                  <span className="GameStateDebug-audio-label">Context:</span>
                  <span
                    className={`GameStateDebug-audio-value ${
                      audioState.contextReady ? "success" : "warning"
                    }`}
                  >
                    {audioState.contextState || "none"}
                  </span>
                </div>
                <div className="GameStateDebug-audio-item">
                  <span className="GameStateDebug-audio-label">Playing:</span>
                  <span
                    className={`GameStateDebug-audio-value ${
                      audioState.isPlaying ? "success" : ""
                    }`}
                  >
                    {audioState.isPlaying ? "Yes" : "No"}
                  </span>
                </div>
                {audioState.mightBeMuted && (
                  <div className="GameStateDebug-audio-item">
                    <span className="GameStateDebug-audio-label warning">
                      ⚠️ Might be muted:
                    </span>
                    <span className="GameStateDebug-audio-value warning">
                      {audioState.playAttempts} attempts, no success
                    </span>
                  </div>
                )}
                {audioState.lastPlaySuccess && (
                  <div className="GameStateDebug-audio-item">
                    <span className="GameStateDebug-audio-label">
                      Last Play:
                    </span>
                    <span className="GameStateDebug-audio-value">
                      {new Date(
                        audioState.lastPlaySuccess
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Controles de Estado do Stanley */}
          <div className="GameStateDebug-stanley">
            <div className="GameStateDebug-stanley-header">
              <span className="GameStateDebug-label">Stanley State:</span>
              <span className="GameStateDebug-stanley-current">
                {stanleyState}
              </span>
            </div>
            <div className="GameStateDebug-stanley-buttons">
              <button
                className="GameStateDebug-stanley-btn"
                onClick={() => handleStanleyStateChange(STANLEY_STATES.HIDDEN)}
                title="Esconder"
              >
                👁️‍🗨️ Hidden
              </button>
              <button
                className="GameStateDebug-stanley-btn"
                onClick={() =>
                  handleStanleyStateChange(STANLEY_STATES.APPEARING)
                }
                title="Aparecer"
              >
                ✨ Appear
              </button>
              <button
                className="GameStateDebug-stanley-btn"
                onClick={() => handleStanleyStateChange(STANLEY_STATES.IDLE)}
                title="Idle"
              >
                😊 Idle
              </button>
              <button
                className="GameStateDebug-stanley-btn"
                onClick={() => handleStanleyStateChange(STANLEY_STATES.TALKING)}
                title="Falando"
              >
                🗣️ Talking
              </button>
              <button
                className="GameStateDebug-stanley-btn"
                onClick={() => handleStanleyStateChange(STANLEY_STATES.EXCITED)}
                title="Excitado"
              >
                🎉 Excited
              </button>
              <button
                className="GameStateDebug-stanley-btn"
                onClick={() =>
                  handleStanleyStateChange(STANLEY_STATES.THINKING)
                }
                title="Pensando"
              >
                🤔 Thinking
              </button>
              <button
                className="GameStateDebug-stanley-btn"
                onClick={() =>
                  handleStanleyStateChange(STANLEY_STATES.DISAPPEARING)
                }
                title="Desaparecer"
              >
                👻 Disappear
              </button>
              <button
                className="GameStateDebug-stanley-btn"
                onClick={() => handleStanleyStateChange(STANLEY_STATES.ANGRY)}
                title="Bravo"
              >
                😠 Angry
              </button>
            </div>
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
