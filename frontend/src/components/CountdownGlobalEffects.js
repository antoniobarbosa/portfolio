import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { activateExplosions } from "./ExplosionEffects";
import "./CountdownTimer.css";

const COUNTDOWN_STORAGE_KEY = "portfolio_countdown_active";
const COUNTDOWN_TIME_KEY = "portfolio_countdown_time";
const COUNTDOWN_MS_KEY = "portfolio_countdown_ms";
const COUNTDOWN_SHOW_CORNER_KEY = "portfolio_countdown_show_corner";

// Função para verificar se countdown está ativo
export const isCountdownActive = () => {
  return localStorage.getItem(COUNTDOWN_STORAGE_KEY) === "true";
};

// Função para ativar countdown
export const activateCountdown = (
  timeLeft = 60,
  milliseconds = 0,
  showInCorner = false
) => {
  localStorage.setItem(COUNTDOWN_STORAGE_KEY, "true");
  localStorage.setItem(COUNTDOWN_TIME_KEY, timeLeft.toString());
  localStorage.setItem(COUNTDOWN_MS_KEY, milliseconds.toString());
  localStorage.setItem(COUNTDOWN_SHOW_CORNER_KEY, showInCorner.toString());
  // Ativa explosões automaticamente quando countdown é ativado
  activateExplosions();
  window.dispatchEvent(new CustomEvent("countdown-activated"));
};

// Função para atualizar tempo do countdown
export const updateCountdownTime = (timeLeft, milliseconds) => {
  if (isCountdownActive()) {
    localStorage.setItem(COUNTDOWN_TIME_KEY, timeLeft.toString());
    localStorage.setItem(COUNTDOWN_MS_KEY, milliseconds.toString());
  }
};

// Função para atualizar posição do countdown
export const updateCountdownPosition = (showInCorner) => {
  if (isCountdownActive()) {
    localStorage.setItem(COUNTDOWN_SHOW_CORNER_KEY, showInCorner.toString());
  }
};

// Função para desativar countdown
export const deactivateCountdown = () => {
  localStorage.removeItem(COUNTDOWN_STORAGE_KEY);
  localStorage.removeItem(COUNTDOWN_TIME_KEY);
  localStorage.removeItem(COUNTDOWN_MS_KEY);
  localStorage.removeItem(COUNTDOWN_SHOW_CORNER_KEY);
  window.dispatchEvent(new CustomEvent("countdown-deactivated"));
};

function CountdownGlobalEffects() {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [milliseconds, setMilliseconds] = useState(0);
  const [showInCorner, setShowInCorner] = useState(false);
  const intervalRef = useRef(null);
  const msIntervalRef = useRef(null);

  // Verifica localStorage e escuta eventos
  useEffect(() => {
    const checkAndUpdateState = () => {
      const active = isCountdownActive();
      if (active) {
        const savedTime = localStorage.getItem(COUNTDOWN_TIME_KEY);
        const savedMs = localStorage.getItem(COUNTDOWN_MS_KEY);
        const savedShowCorner = localStorage.getItem(COUNTDOWN_SHOW_CORNER_KEY);

        setIsActive(true);
        setTimeLeft(savedTime ? parseInt(savedTime, 10) : 60);
        setMilliseconds(savedMs ? parseInt(savedMs, 10) : 0);
        setShowInCorner(savedShowCorner === "true");
      } else {
        setIsActive(false);
      }
    };

    // Verifica estado inicial
    checkAndUpdateState();

    // Se o countdown já estiver ativo, ativa as explosões também
    if (isCountdownActive()) {
      activateExplosions();
    }

    // Verifica periodicamente
    const checkInterval = setInterval(checkAndUpdateState, 500);

    const handleActivate = () => {
      checkAndUpdateState();
    };

    const handleDeactivate = () => {
      setIsActive(false);
    };

    const handleStorageChange = (e) => {
      if (
        e.key === COUNTDOWN_STORAGE_KEY ||
        e.key === COUNTDOWN_TIME_KEY ||
        e.key === COUNTDOWN_MS_KEY ||
        e.key === COUNTDOWN_SHOW_CORNER_KEY
      ) {
        checkAndUpdateState();
      }
    };

    window.addEventListener("countdown-activated", handleActivate);
    window.addEventListener("countdown-deactivated", handleDeactivate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener("countdown-activated", handleActivate);
      window.removeEventListener("countdown-deactivated", handleDeactivate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Aplica shake e overlay quando ativo
  useEffect(() => {
    if (isActive) {
      document.body.classList.add("countdown-shake");
    } else {
      document.body.classList.remove("countdown-shake");
    }

    return () => {
      document.body.classList.remove("countdown-shake");
    };
  }, [isActive]);

  // Atualiza o timer continuamente - sempre que estiver ativo
  useEffect(() => {
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (msIntervalRef.current) {
        clearInterval(msIntervalRef.current);
        msIntervalRef.current = null;
      }
      return;
    }

    // Timer de segundos - continua decrementando
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        const currentTime = parseInt(
          localStorage.getItem(COUNTDOWN_TIME_KEY) || "60",
          10
        );
        const newTime = currentTime <= 1 ? 0 : currentTime - 1;
        localStorage.setItem(COUNTDOWN_TIME_KEY, newTime.toString());
        setTimeLeft(newTime);
        if (newTime === 0) {
          deactivateCountdown();
        }
      }, 1000);
    }

    // Timer de milissegundos - continua decrementando
    if (!msIntervalRef.current) {
      msIntervalRef.current = setInterval(() => {
        const currentMs = parseInt(
          localStorage.getItem(COUNTDOWN_MS_KEY) || "0",
          10
        );
        const newMs = currentMs <= 0 ? 99 : currentMs - 1;
        localStorage.setItem(COUNTDOWN_MS_KEY, newMs.toString());
        setMilliseconds(newMs);
      }, 10);
    }

    // Após 10 segundos do início, move para o canto (se ainda não estiver)
    const savedTime = parseInt(
      localStorage.getItem(COUNTDOWN_TIME_KEY) || "60",
      10
    );
    if (savedTime === 60 && !showInCorner) {
      const startTime = Date.now();
      const checkMoveToCorner = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= 10 && !showInCorner) {
          setShowInCorner(true);
          updateCountdownPosition(true);
          clearInterval(checkMoveToCorner);
        }
      }, 100);

      return () => {
        clearInterval(checkMoveToCorner);
      };
    }

    return () => {
      // Não limpa os intervals aqui - eles devem continuar rodando
      // Apenas limpa quando isActive muda para false
    };
  }, [isActive, showInCorner]);

  // Sincroniza o estado com localStorage periodicamente
  useEffect(() => {
    if (!isActive) return;

    const syncInterval = setInterval(() => {
      const savedTime = localStorage.getItem(COUNTDOWN_TIME_KEY);
      const savedMs = localStorage.getItem(COUNTDOWN_MS_KEY);
      const savedShowCorner = localStorage.getItem(COUNTDOWN_SHOW_CORNER_KEY);

      if (savedTime) {
        const time = parseInt(savedTime, 10);
        if (time !== timeLeft) {
          setTimeLeft(time);
        }
      }
      if (savedMs) {
        const ms = parseInt(savedMs, 10);
        if (ms !== milliseconds) {
          setMilliseconds(ms);
        }
      }
      if (savedShowCorner) {
        const showCorner = savedShowCorner === "true";
        if (showCorner !== showInCorner) {
          setShowInCorner(showCorner);
        }
      }
    }, 100); // Sincroniza a cada 100ms

    return () => {
      clearInterval(syncInterval);
    };
  }, [isActive, timeLeft, milliseconds, showInCorner]);

  const formatTime = (seconds, ms) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}'${String(secs).padStart(
      2,
      "0"
    )}"${String(ms).padStart(2, "0")}`;
  };

  if (!isActive) return null;

  const alertContent = (
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
  );

  const redOverlay = <div className="countdown-red-overlay" />;

  return (
    <>
      {createPortal(alertContent, document.body)}
      {createPortal(redOverlay, document.body)}
    </>
  );
}

export default CountdownGlobalEffects;
