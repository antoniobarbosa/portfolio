import React, { useState } from "react";
import { eventBus } from "../core";
import "./GameStartOverlay.css";

function GameStartOverlay() {
  const [isRevealing, setIsRevealing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

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
