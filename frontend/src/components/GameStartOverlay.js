import React, { useState, useEffect } from "react";
import { eventBus, achievementManager } from "../core";
import "./GameStartOverlay.css";

function GameStartOverlay() {
  const [isRevealing, setIsRevealing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [hasGameStartAchievement, setHasGameStartAchievement] = useState(false);

  // Verifica se já tem o achievement "game_start"
  useEffect(() => {
    const checkAchievement = () => {
      const hasAchievement = achievementManager.hasAchievement("game_start");
      setHasGameStartAchievement(hasAchievement);
      if (hasAchievement) {
        setIsVisible(false);
      }
    };

    checkAchievement();
  }, []);

  const handleClick = (e) => {
    // Previne múltiplas execuções
    if (isRevealing) {
      return;
    }

    // Emite o evento GAME_START com informações do clique
    eventBus.emit("GAME_START", {
      id: e.currentTarget.id || "GameStartOverlay",
      target: "DIV",
      element: e.currentTarget.className,
      x: e.clientX,
      y: e.clientY,
    });
    // Achievement será adicionado automaticamente quando o evento for processado
    // Inicia a animação de revelação
    setIsRevealing(true);

    // Remove completamente após a animação
    setTimeout(() => {
      setIsVisible(false);
    }, 1000); // Ajuste conforme a duração da animação
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      id="GameStartOverlay"
      className={`GameStartOverlay ${isRevealing ? "revealing" : ""}`}
      onClick={handleClick}
    >
      <div className="GameStartOverlay-content">
        <div className="GameStartOverlay-text">Click here to start</div>
        <div className="GameStartOverlay-subtitle">
          Clique aqui para iniciar
        </div>
      </div>
    </div>
  );
}

export default GameStartOverlay;
