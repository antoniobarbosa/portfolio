import React, { useState, useEffect, useRef, useCallback } from "react";
import "./StanleyCharacter.css";
import { eventBus } from "../core";

// Estados possíveis do Stanley
export const STANLEY_STATES = {
  HIDDEN: "hidden",
  APPEARING: "appearing",
  IDLE: "idle",
  TALKING: "talking",
  DISAPPEARING: "disappearing",
  EXCITED: "excited",
  THINKING: "thinking",
  ANGRY: "angry",
};

// Singleton para gerenciar o estado do Stanley
class StanleyStateManager {
  constructor() {
    this.currentState = STANLEY_STATES.IDLE;
    this.listeners = new Set();
  }

  setState(newState) {
    if (this.currentState !== newState) {
      this.currentState = newState;
      this.notifyListeners();
    }
  }

  getState() {
    return this.currentState;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach((listener) => listener(this.currentState));
  }
}

export const stanleyStateManager = new StanleyStateManager();

function StanleyCharacter() {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [eyesClosed, setEyesClosed] = useState(false);
  const [currentState, setCurrentState] = useState(STANLEY_STATES.IDLE);
  const characterRef = useRef(null);
  const blinkIntervalRef = useRef(null);
  const stateTimeoutRef = useRef(null);

  // Olhos seguindo o mouse
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging) return; // Não move os olhos enquanto arrasta

      const rect = characterRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Calcula posição relativa ao centro do personagem
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Normaliza entre -1 e 1, multiplicado por um fator de movimento
      const normX = ((e.clientX - centerX) / window.innerWidth) * 20;
      const normY = ((e.clientY - centerY) / window.innerHeight) * 20;

      // Limita o movimento dos olhos
      const maxMovement = 8;
      const clampedX = Math.max(-maxMovement, Math.min(maxMovement, normX));
      const clampedY = Math.max(-maxMovement, Math.min(maxMovement, normY));

      setEyePosition({ x: clampedX, y: clampedY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isDragging]);

  // Escuta mudanças de estado do gerenciador
  useEffect(() => {
    const unsubscribe = stanleyStateManager.subscribe((newState) => {
      setCurrentState(newState);
    });
    return unsubscribe;
  }, []);

  // Escuta eventos de áudio para mudar estado
  useEffect(() => {
    const handleAudioStart = () => {
      stanleyStateManager.setState(STANLEY_STATES.TALKING);
    };

    const handleAudioEnded = () => {
      // Quando áudio termina, volta para idle após um breve delay
      if (stateTimeoutRef.current) {
        clearTimeout(stateTimeoutRef.current);
      }
      stateTimeoutRef.current = setTimeout(() => {
        stanleyStateManager.setState(STANLEY_STATES.IDLE);
      }, 300);
    };

    const handleAudioInterrupted = () => {
      // Quando áudio é interrompido, volta para idle após um breve delay
      if (stateTimeoutRef.current) {
        clearTimeout(stateTimeoutRef.current);
      }
      stateTimeoutRef.current = setTimeout(() => {
        stanleyStateManager.setState(STANLEY_STATES.IDLE);
      }, 300);
    };

    // Escuta quando áudio começa a tocar
    eventBus.on("AUDIO_START", handleAudioStart);
    eventBus.on("AUDIO_ENDED", handleAudioEnded);
    eventBus.on("AUDIO_INTERRUPTED", handleAudioInterrupted);

    return () => {
      eventBus.off("AUDIO_START", handleAudioStart);
      eventBus.off("AUDIO_ENDED", handleAudioEnded);
      eventBus.off("AUDIO_INTERRUPTED", handleAudioInterrupted);
      if (stateTimeoutRef.current) {
        clearTimeout(stateTimeoutRef.current);
      }
    };
  }, []);

  // Gerencia transições de estado
  useEffect(() => {
    if (stateTimeoutRef.current) {
      clearTimeout(stateTimeoutRef.current);
    }

    switch (currentState) {
      case STANLEY_STATES.APPEARING:
        // Após aparecer, vai para idle
        stateTimeoutRef.current = setTimeout(() => {
          stanleyStateManager.setState(STANLEY_STATES.IDLE);
        }, 500);
        break;
      case STANLEY_STATES.TALKING:
        // Quando termina de falar, volta para idle (será controlado pelo áudio)
        break;
      case STANLEY_STATES.DISAPPEARING:
        // Após desaparecer, vai para hidden
        stateTimeoutRef.current = setTimeout(() => {
          stanleyStateManager.setState(STANLEY_STATES.HIDDEN);
        }, 500);
        break;
      case STANLEY_STATES.EXCITED:
        // Após excitação, volta para idle
        stateTimeoutRef.current = setTimeout(() => {
          stanleyStateManager.setState(STANLEY_STATES.IDLE);
        }, 1000);
        break;
      case STANLEY_STATES.THINKING:
        // Após pensar, volta para idle
        stateTimeoutRef.current = setTimeout(() => {
          stanleyStateManager.setState(STANLEY_STATES.IDLE);
        }, 2000);
        break;
      case STANLEY_STATES.ANGRY:
        // Após ficar bravo, volta para idle
        stateTimeoutRef.current = setTimeout(() => {
          stanleyStateManager.setState(STANLEY_STATES.IDLE);
        }, 1500);
        break;
      default:
        break;
    }

    return () => {
      if (stateTimeoutRef.current) {
        clearTimeout(stateTimeoutRef.current);
      }
    };
  }, [currentState]);

  // Animação de piscar (apenas quando não está em estados especiais)
  useEffect(() => {
    if (
      currentState === STANLEY_STATES.HIDDEN ||
      currentState === STANLEY_STATES.DISAPPEARING ||
      currentState === STANLEY_STATES.APPEARING
    ) {
      return;
    }

    const blink = () => {
      setEyesClosed(true);
      setTimeout(() => {
        setEyesClosed(false);
      }, 150);
    };

    // Pisca aleatoriamente entre 2.7s e 4.2s
    const scheduleBlink = () => {
      const delay = 2700 + Math.random() * 1500;
      blinkIntervalRef.current = setTimeout(() => {
        blink();
        scheduleBlink();
      }, delay);
    };

    scheduleBlink();

    return () => {
      if (blinkIntervalRef.current) {
        clearTimeout(blinkIntervalRef.current);
      }
    };
  }, [currentState]);

  // Função para iniciar o arrasto
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return; // Apenas botão esquerdo

    const rect = characterRef.current?.getBoundingClientRect();
    if (!rect) return;

    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    setDragOffset({ x: offsetX, y: offsetY });
    setIsDragging(true);
  }, []);

  // Função para mover durante o arrasto
  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      // Limita dentro da viewport
      const maxX = window.innerWidth - 260;
      const maxY = window.innerHeight - 260;

      setPosition({
        x: Math.max(0, Math.min(maxX, newX)),
        y: Math.max(0, Math.min(maxY, newY)),
      });
    },
    [isDragging, dragOffset]
  );

  // Função para parar o arrasto
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Event listeners para arrastar
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Cálculo das posições das pupilas (ajustadas para a imagem PNG do Clippy)
  // Posições relativas ao centro da imagem (ajustar conforme necessário)
  const leftPupilX = 80 + eyePosition.x;
  const leftPupilY = 90 + eyePosition.y;
  const rightPupilX = 120 + eyePosition.x;
  const rightPupilY = 90 + eyePosition.y;

  // Altura dos olhos (fechados ou abertos)
  // No estado angry, sempre fechado
  const eyeHeight =
    currentState === STANLEY_STATES.ANGRY || eyesClosed ? 2 : 18;

  // Posição das sobrancelhas baseada no estado
  const getEyebrowPosition = () => {
    switch (currentState) {
      case STANLEY_STATES.ANGRY:
        return { y: 73, arch: -5 }; // Sobrancelhas inclinadas, descendo menos
      case STANLEY_STATES.EXCITED:
        return { y: 70, arch: 12 }; // Sobrancelhas altas e arqueadas
      case STANLEY_STATES.THINKING:
        return { y: 72, arch: 5 }; // Sobrancelhas normais
      case STANLEY_STATES.TALKING:
        return { y: 73, arch: 8 }; // Sobrancelhas levemente arqueadas
      default:
        return { y: 73, arch: 6 }; // Posição padrão (sempre arqueadas)
    }
  };

  const eyebrowPos = getEyebrowPosition();

  // Não renderiza se estiver hidden
  if (currentState === STANLEY_STATES.HIDDEN) {
    return null;
  }

  return (
    <div
      ref={characterRef}
      className={`stanley-character ${
        isDragging ? "dragging" : ""
      } state-${currentState}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Imagem PNG do Clippy como corpo */}
      <img
        src="/clippy-real.png"
        alt="Clippy"
        className="stanley-body"
        draggable={false}
      />

      {/* SVG sobreposto apenas para os olhos animados */}
      <svg
        className="stanley-eyes"
        width="260"
        height="260"
        viewBox="0 0 200 200"
      >
        {/* Sobrancelha esquerda - usando SVG fornecido */}
        <g
          className="eyebrow-group eyebrow-left"
          transform={`translate(120, ${eyebrowPos.y - eyebrowPos.arch * 1.8})`}
        >
          <path
            className="eyebrow eyebrow-left-path"
            d="M18.9372,9.36167 C20.6395,10.1301 22.108,11.2831 22.8998,12.9158 C23.0681,13.2628 23.0219,13.6757 22.781,13.9769 C22.5401,14.278 22.1474,14.4138 21.772,14.3258 C15.8145,12.93 9.78907,15.3311 6.61118,16.6414 C4.618,17.4633 2.68113,16.7923 1.68066,15.44 C1.18289,14.7672 0.915929,13.9186 1.02369,13.0307 C1.36416,10.2254 4.88953,9.02468 7.21626,8.49728 C10.9972,7.64025 15.3643,7.74879 18.9372,9.36167 Z"
            fill="#333"
          />
        </g>

        {/* Sobrancelha direita - usando SVG fornecido (espelhada) */}
        <g
          className="eyebrow-group eyebrow-right"
          transform={`translate(80, ${eyebrowPos.y - eyebrowPos.arch * 1.8})`}
        >
          <path
            className="eyebrow eyebrow-right-path"
            d="M18.9372,9.36167 C20.6395,10.1301 22.108,11.2831 22.8998,12.9158 C23.0681,13.2628 23.0219,13.6757 22.781,13.9769 C22.5401,14.278 22.1474,14.4138 21.772,14.3258 C15.8145,12.93 9.78907,15.3311 6.61118,16.6414 C4.618,17.4633 2.68113,16.7923 1.68066,15.44 C1.18289,14.7672 0.915929,13.9186 1.02369,13.0307 C1.36416,10.2254 4.88953,9.02468 7.21626,8.49728 C10.9972,7.64025 15.3643,7.74879 18.9372,9.36167 Z"
            fill="#333"
          />
        </g>

        {/* Olho esquerdo com pupila agrupados */}
        <g className="eye-group eye-left">
          <ellipse
            className="eye"
            cx="80"
            cy="90"
            rx="18"
            ry={eyeHeight}
            fill="white"
            stroke="#333"
            strokeWidth="1"
          />
          {!eyesClosed && currentState !== STANLEY_STATES.ANGRY && (
            <>
              <circle
                id="pupilLeft"
                cx={leftPupilX}
                cy={leftPupilY}
                r="10"
                fill="#333"
              />
              {/* Brilho no olho esquerdo */}
              <circle
                cx={leftPupilX - 3}
                cy={leftPupilY - 3}
                r="3"
                fill="white"
              />
            </>
          )}
        </g>

        {/* Olho direito com pupila agrupados */}
        <g className="eye-group eye-right">
          <ellipse
            className="eye"
            cx="120"
            cy="90"
            rx="18"
            ry={eyeHeight}
            fill="white"
            stroke="#333"
            strokeWidth="1"
          />
          {!eyesClosed && currentState !== STANLEY_STATES.ANGRY && (
            <>
              <circle
                id="pupilRight"
                cx={rightPupilX}
                cy={rightPupilY}
                r="10"
                fill="#333"
              />
              {/* Brilho no olho direito */}
              <circle
                cx={rightPupilX - 3}
                cy={rightPupilY - 3}
                r="3"
                fill="white"
              />
            </>
          )}
        </g>
      </svg>
    </div>
  );
}

export default StanleyCharacter;
