import React, { useState } from "react";
import "./ClickerGame.css";

function ClickerGame({ onClose }) {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount((prev) => prev + 1);
  };

  return (
    <div className="ClickerGame-overlay">
      <div className="ClickerGame-container">
        <div className="ClickerGame-header">
          <h2>Clicker Game</h2>
          <button className="ClickerGame-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="ClickerGame-content">
          <div className="ClickerGame-counter">
            <span className="ClickerGame-count">{count}</span>
          </div>

          <button className="ClickerGame-button" onClick={handleClick}>
            Clique Aqui!
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClickerGame;
