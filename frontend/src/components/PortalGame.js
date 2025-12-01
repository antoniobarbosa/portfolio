import React, { useRef, useEffect } from "react";
import "./PortalGame.css";

function PortalGame({ onClose }) {
  const canvasRef = useRef(null);
  const onCloseRef = useRef(onClose);

  // Atualiza a referência do onClose sempre que mudar
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = (canvas.width = 600);
    const height = (canvas.height = 400);

    // Configuração do jogo
    const walls = [
      { x: 0, y: 0, width: width, height: 20 },
      { x: 0, y: height - 20, width: width, height: 20 },
      { x: 0, y: 0, width: 20, height: height },
      { x: width - 20, y: 0, width: 20, height: height },
      { x: 150, y: 100, width: 120, height: 20 },
      { x: 330, y: 200, width: 120, height: 20 },
      { x: 150, y: 300, width: 120, height: 20 },
    ];

    const portals = {
      blue: { x: 50, y: height / 2, color: "#4a90e2" },
      orange: { x: width - 50, y: height / 2, color: "#ff6b35" },
    };

    // Estado do jogo
    const state = {
      cursorX: width / 2,
      cursorY: height / 2,
      pointerLocked: false,
      isInsidePortal: false, // Estado único: dentro ou fora de qualquer portal
    };

    // Funções auxiliares
    function getDistance(x1, y1, x2, y2) {
      return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }

    function limitToCanvas(x, y) {
      // Considera o tamanho do cursor visual (12px para cima e esquerda)
      const cursorOffset = 12;
      return {
        x: Math.max(cursorOffset, Math.min(width - 1, x)),
        y: Math.max(cursorOffset, Math.min(height - 1, y)),
      };
    }

    // Verifica e processa teletransporte
    function checkTeleport() {
      const distToBlue = getDistance(
        state.cursorX,
        state.cursorY,
        portals.blue.x,
        portals.blue.y
      );
      const distToOrange = getDistance(
        state.cursorX,
        state.cursorY,
        portals.orange.x,
        portals.orange.y
      );

      const nowInsideBlue = distToBlue < 30;
      const nowInsideOrange = distToOrange < 30;
      const nowInsideAnyPortal = nowInsideBlue || nowInsideOrange;

      // Se não está dentro de nenhum portal, pode teletransportar
      if (!state.isInsidePortal) {
        // Entrou no portal laranja - teletransporta para o azul
        if (nowInsideOrange) {
          state.cursorX = portals.blue.x;
          state.cursorY = portals.blue.y;
          state.isInsidePortal = true; // Marca que está dentro de um portal
        }
        // Entrou no portal azul - teletransporta para o laranja
        else if (nowInsideBlue) {
          state.cursorX = portals.orange.x;
          state.cursorY = portals.orange.y;
          state.isInsidePortal = true; // Marca que está dentro de um portal
        }
      }

      // Só permite novo teletransporte quando sair completamente de todos os portais
      if (!nowInsideAnyPortal) {
        state.isInsidePortal = false;
      }
    }

    // Handlers do Pointer Lock
    const handlePointerLockMove = (e) => {
      if (!state.pointerLocked) return;

      const movementX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
      const movementY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

      // Atualiza posição do cursor
      state.cursorX += movementX;
      state.cursorY += movementY;

      // Limita dentro do canvas
      const limited = limitToCanvas(state.cursorX, state.cursorY);
      state.cursorX = limited.x;
      state.cursorY = limited.y;

      checkTeleport();
    };

    const handleCanvasClick = async (e) => {
      e.preventDefault();
      requestPointerLock();
    };

    const requestPointerLock = () => {
      if (!state.pointerLocked) {
        try {
          if (canvas.requestPointerLock) {
            canvas.requestPointerLock().catch(() => {
              // Ignora erro se o usuário não permitir
            });
          } else if (canvas.mozRequestPointerLock) {
            canvas.mozRequestPointerLock();
          } else if (canvas.webkitRequestPointerLock) {
            canvas.webkitRequestPointerLock();
          }
        } catch (err) {
          console.log("Erro ao solicitar pointer lock:", err);
        }
      }
    };

    const handlePointerLockChange = () => {
      const isLocked =
        document.pointerLockElement === canvas ||
        document.mozPointerLockElement === canvas ||
        document.webkitPointerLockElement === canvas;

      const wasLocked = state.pointerLocked;
      state.pointerLocked = isLocked;
      canvas.style.cursor = isLocked ? "none" : "crosshair";

      // Quando pointer lock é ativado, garante que o canvas tenha foco
      if (isLocked && !wasLocked) {
        canvas.focus();
      }

      // Se o pointer lock foi perdido (ESC pressionado), fecha o jogo
      if (wasLocked && !isLocked) {
        if (onCloseRef.current) {
          onCloseRef.current();
        }
      }
    };

    const handleKeyDown = (e) => {
      console.log("Keydown event:", e.key, e.keyCode, e.target);
      if (e.key === "Escape" || e.keyCode === 27) {
        console.log("Fechando portal game");
        e.preventDefault();
        e.stopPropagation();
        // Fecha o modal chamando onClose
        if (onCloseRef.current) {
          onCloseRef.current();
        }
      }
    };

    // Event listeners
    canvas.addEventListener("mousemove", handlePointerLockMove);
    canvas.addEventListener("click", handleCanvasClick);
    canvas.addEventListener("keydown", handleKeyDown); // ESC no canvas
    canvas.setAttribute("tabindex", "0"); // Permite que o canvas receba eventos de teclado
    document.addEventListener("pointerlockchange", handlePointerLockChange);
    document.addEventListener("mozpointerlockchange", handlePointerLockChange);
    document.addEventListener(
      "webkitpointerlockchange",
      handlePointerLockChange
    );
    document.addEventListener("keydown", handleKeyDown); // ESC no document também

    // Renderização
    function render() {
      // Limpa canvas
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, width, height);

      // Paredes
      ctx.fillStyle = "#16213e";
      walls.forEach((wall) => {
        ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
      });

      // Portais
      Object.values(portals).forEach((portal) => {
        ctx.fillStyle = portal.color;
        ctx.beginPath();
        ctx.arc(portal.x, portal.y, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.shadowBlur = 20;
        ctx.shadowColor = portal.color;
        ctx.beginPath();
        ctx.arc(portal.x, portal.y, 30, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Linha conectando portais quando cursor está próximo
      const distToBlue = getDistance(
        state.cursorX,
        state.cursorY,
        portals.blue.x,
        portals.blue.y
      );
      const distToOrange = getDistance(
        state.cursorX,
        state.cursorY,
        portals.orange.x,
        portals.orange.y
      );

      if (distToBlue < 30 || distToOrange < 30) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(portals.orange.x, portals.orange.y);
        ctx.lineTo(portals.blue.x, portals.blue.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Cursor visual (formato de cursor/seta diagonal)
      ctx.save();
      ctx.translate(state.cursorX, state.cursorY);

      // Desenha o cursor como uma seta diagonal (canto superior esquerdo)
      // Corpo principal (branco)
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(0, 0); // Ponta do cursor (canto inferior direito)
      ctx.lineTo(0, -12); // Linha vertical esquerda
      ctx.lineTo(-4, -12); // Base da seta
      ctx.lineTo(-12, -4); // Linha diagonal superior
      ctx.lineTo(-12, 0); // Linha horizontal superior
      ctx.closePath();
      ctx.fill();

      // Contorno preto para destacar
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Sombra interna para dar profundidade
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-2, -2);
      ctx.lineTo(-2, -10);
      ctx.lineTo(-4, -10);
      ctx.lineTo(-10, -4);
      ctx.lineTo(-10, -2);
      ctx.lineTo(-2, -2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // Game loop
    let animationFrameId;
    function gameLoop() {
      render();
      animationFrameId = requestAnimationFrame(gameLoop);
    }
    gameLoop();

    // Ativa pointer lock automaticamente ao montar
    setTimeout(() => {
      requestPointerLock();
      // Garante que o canvas tenha foco para receber eventos de teclado
      canvas.focus();
    }, 100);

    // Cleanup
    return () => {
      canvas.removeEventListener("mousemove", handlePointerLockMove);
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener(
        "pointerlockchange",
        handlePointerLockChange
      );
      document.removeEventListener(
        "mozpointerlockchange",
        handlePointerLockChange
      );
      document.removeEventListener(
        "webkitpointerlockchange",
        handlePointerLockChange
      );
      document.removeEventListener("keydown", handleKeyDown);

      // Tenta sair do pointer lock se estiver ativo

      cancelAnimationFrame(animationFrameId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="PortalGame-overlay">
      <div className="PortalGame-container">
        <div className="PortalGame-header">
          <h2>Portal Game</h2>
          <button className="PortalGame-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="PortalGame-info">
          <div className="PortalGame-instructions">
            <p>
              <strong>Como jogar:</strong>
            </p>
            <p>Clique no canvas para prender o cursor</p>
            <p>
              Passe o cursor sobre qualquer portal para ser teletransportado!
            </p>
            <p>Pressione ESC para soltar o cursor</p>
          </div>
        </div>

        <canvas ref={canvasRef} className="PortalGame-canvas" />

        <div className="PortalGame-hint">
          <p>✨ Clique no canvas para começar! Pressione ESC para sair ✨</p>
        </div>
      </div>
    </div>
  );
}

export default PortalGame;
