import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { activateCountdown } from "./CountdownGlobalEffects";
import "./CountdownTimer.css";

function CountdownTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [milliseconds, setMilliseconds] = useState(0);
  const [showInCorner, setShowInCorner] = useState(false);
  const intervalRef = useRef(null);
  const msIntervalRef = useRef(null);

  // Remove shake e overlay local - agora é gerenciado globalmente

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Milissegundos fake (decrementa rapidamente)
      msIntervalRef.current = setInterval(() => {
        setMilliseconds((prev) => {
          if (prev <= 0) {
            return 99;
          }
          return prev - 1;
        });
      }, 10); // Atualiza a cada 10ms para parecer mais real

      // Após 10 segundos, move para o canto
      if (timeLeft === 60) {
        setTimeout(() => {
          setShowInCorner(true);
        }, 10000);
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (msIntervalRef.current) {
        clearInterval(msIntervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (msIntervalRef.current) {
        clearInterval(msIntervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  const handleStart = () => {
    setTimeLeft(60);
    setMilliseconds(0);
    setIsRunning(true);
    setShowInCorner(false);
    // Ativa countdown globalmente (explosões são ativadas automaticamente)
    activateCountdown(60, 0, false);
  };

  const formatTime = (seconds, ms) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    // Formato: MM'SS"CC (com centésimos/milissegundos)
    return `${String(mins).padStart(2, "0")}'${String(secs).padStart(
      2,
      "0"
    )}"${String(ms).padStart(2, "0")}`;
  };

  const alertContent =
    isRunning || showInCorner ? (
      <div
        className={`metroid-alert ${
          showInCorner ? "metroid-alert--corner" : "metroid-alert--center"
        }`}
      >
        {!showInCorner && (
          <>
            <div className="alert-title">EMERGENCY</div>
            <div className="alert-line">SELF DESTRUCT SEQUENCE</div>
            <div className="alert-line">ACTIVATED EVACUATE</div>
            <div className="alert-line">COLONY IMMEDIATELY</div>
          </>
        )}
        <div className="timer-label">TIME</div>
        <div className="timer-value">{formatTime(timeLeft, milliseconds)}</div>
      </div>
    ) : null;

  return (
    <>
      <div className="CountdownTimer-container">
        {!isRunning && !showInCorner && (
          <button className="CountdownTimer-start-button" onClick={handleStart}>
            Iniciar
          </button>
        )}
      </div>
      {/* Renderiza o alerta localmente apenas quando está rodando e não está no canto */}
      {isRunning &&
        !showInCorner &&
        alertContent &&
        createPortal(alertContent, document.body)}
    </>
  );
}

export default CountdownTimer;
