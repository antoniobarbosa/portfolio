import React, { useRef, useEffect, useState } from "react";
import "./WitnessGame.css";

function WitnessGame({ onClose }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [currentMousePos, setCurrentMousePos] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const gridSize = 3;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const cellSize = Math.min(canvas.width, canvas.height) / (gridSize + 1);
    const offsetX = (canvas.width - cellSize * gridSize) / 2;
    const offsetY = (canvas.height - cellSize * gridSize) / 2;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fundo do grid com glow azul
      const gridPadding = cellSize * 0.3;
      const gridX = offsetX - gridPadding;
      const gridY = offsetY - gridPadding;
      const gridWidth = cellSize * gridSize + gridPadding * 2;
      const gridHeight = cellSize * gridSize + gridPadding * 2;

      // Desenha fundo do grid com bordas arredondadas
      ctx.fillStyle = "rgba(74, 144, 226, 0.15)";
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#4a90e2";
      ctx.beginPath();
      // Topo com "orelhas" arredondadas
      const cornerRadius = cellSize * 0.4;
      ctx.moveTo(gridX + cornerRadius, gridY);
      ctx.lineTo(gridX + gridWidth - cornerRadius, gridY);
      ctx.quadraticCurveTo(
        gridX + gridWidth,
        gridY,
        gridX + gridWidth,
        gridY + cornerRadius
      );
      ctx.lineTo(gridX + gridWidth, gridY + gridHeight - cornerRadius);
      ctx.quadraticCurveTo(
        gridX + gridWidth,
        gridY + gridHeight,
        gridX + gridWidth - cornerRadius,
        gridY + gridHeight
      );
      ctx.lineTo(gridX + cornerRadius, gridY + gridHeight);
      ctx.quadraticCurveTo(
        gridX,
        gridY + gridHeight,
        gridX,
        gridY + gridHeight - cornerRadius
      );
      ctx.lineTo(gridX, gridY + cornerRadius);
      ctx.quadraticCurveTo(gridX, gridY, gridX + cornerRadius, gridY);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Desenha linhas do grid azuis brilhantes
      ctx.strokeStyle = "#4a90e2";
      ctx.lineWidth = 27;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#4a90e2";
      for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + i * cellSize, offsetY);
        ctx.lineTo(offsetX + i * cellSize, offsetY + cellSize * gridSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + i * cellSize);
        ctx.lineTo(offsetX + cellSize * gridSize, offsetY + i * cellSize);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // Desenha linha do caminho - branca brilhante conectando vértices e mouse
      if (currentPath.length > 0) {
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 20;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#ffffff";
        ctx.beginPath();

        // Primeiro vértice
        const startX = offsetX + currentPath[0].x * cellSize;
        const startY = offsetY + currentPath[0].y * cellSize;
        ctx.moveTo(startX, startY);

        // Conecta todos os vértices
        for (let i = 1; i < currentPath.length; i++) {
          const x = offsetX + currentPath[i].x * cellSize;
          const y = offsetY + currentPath[i].y * cellSize;
          ctx.lineTo(x, y);
        }

        // Se está desenhando, conecta até a posição atual do mouse (apenas horizontal ou vertical)
        if (isDrawing && currentMousePos && currentPath.length > 0) {
          const rect = canvas.getBoundingClientRect();
          const mouseX = currentMousePos.x - rect.left;
          const mouseY = currentMousePos.y - rect.top;

          // Pega o último vértice do caminho
          const lastVertexX =
            offsetX + currentPath[currentPath.length - 1].x * cellSize;
          const lastVertexY =
            offsetY + currentPath[currentPath.length - 1].y * cellSize;

          // Calcula distâncias horizontal e vertical
          const dx = Math.abs(mouseX - lastVertexX);
          const dy = Math.abs(mouseY - lastVertexY);

          // Escolhe a direção com maior movimento (horizontal ou vertical)
          let nextX = lastVertexX;
          let nextY = lastVertexY;

          if (dx > dy) {
            // Movimento horizontal
            nextX = mouseX;
            nextY = lastVertexY; // Mantém Y do último vértice
          } else {
            // Movimento vertical
            nextX = lastVertexX; // Mantém X do último vértice
            nextY = mouseY;
          }

          ctx.lineTo(nextX, nextY);
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Ponto de início (círculo branco grande no vértice inicial)
      const startX = offsetX;
      const startY = offsetY;
      const startRadius = cellSize / 3;
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ffffff";
      ctx.beginPath();
      ctx.arc(startX, startY, startRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ponto de saída (círculo branco menor no vértice final)
      const endX = offsetX + gridSize * cellSize;
      const endY = offsetY + gridSize * cellSize;
      const endRadius = cellSize / 4;
      ctx.fillStyle = "#ffffff";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ffffff";
      ctx.beginPath();
      ctx.arc(endX, endY, endRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    draw();
  }, [currentPath, currentMousePos, isDrawing, isCompleted]);

  const getVertexFromPoint = (x, y) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const cellSize = Math.min(rect.width, rect.height) / (gridSize + 1);
    const offsetX = (rect.width - cellSize * gridSize) / 2;
    const offsetY = (rect.height - cellSize * gridSize) / 2;

    // Calcula qual vértice está mais próximo
    const relX = x - rect.left - offsetX;
    const relY = y - rect.top - offsetY;

    const vertexX = Math.round(relX / cellSize);
    const vertexY = Math.round(relY / cellSize);

    // Verifica se está próximo o suficiente de um vértice
    const distX = Math.abs(relX - vertexX * cellSize);
    const distY = Math.abs(relY - vertexY * cellSize);
    const threshold = cellSize * 0.3;

    if (
      distX < threshold &&
      distY < threshold &&
      vertexX >= 0 &&
      vertexX <= gridSize &&
      vertexY >= 0 &&
      vertexY <= gridSize
    ) {
      return { x: vertexX, y: vertexY };
    }
    return null;
  };

  const isValidMove = (from, to) => {
    if (!from || !to) return false;
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    // Permite movimento para vértices adjacentes (horizontal, vertical ou diagonal)
    return dx <= 1 && dy <= 1 && dx + dy > 0;
  };

  const handleMouseDown = (e) => {
    const vertex = getVertexFromPoint(e.clientX, e.clientY);
    // Inicia no vértice (0, 0) - canto superior esquerdo
    if (vertex && vertex.x === 0 && vertex.y === 0) {
      setIsDrawing(true);
      setIsCompleted(false);
      setCurrentPath([vertex]);
    }
  };

  const handleMouseMove = (e) => {
    // Atualiza posição do mouse em tempo real para preenchimento
    if (isDrawing) {
      setCurrentMousePos({ x: e.clientX, y: e.clientY });
    }

    if (!isDrawing) return;

    const vertex = getVertexFromPoint(e.clientX, e.clientY);
    if (!vertex) return;

    const lastVertex = currentPath[currentPath.length - 1];
    if (
      isValidMove(lastVertex, vertex) &&
      !currentPath.some((v) => v.x === vertex.x && v.y === vertex.y)
    ) {
      const newPath = [...currentPath, vertex];
      setCurrentPath(newPath);

      // Verifica se completou - chegou no vértice oposto
      if (vertex.x === gridSize && vertex.y === gridSize) {
        setIsCompleted(true);
        setIsDrawing(false);
        setCurrentMousePos(null);
        setTimeout(() => {
          alert("Puzzle completed! 🎉");
          handleReset();
        }, 300);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setCurrentMousePos(null);
  };

  const handleReset = () => {
    setCurrentPath([]);
    setIsDrawing(false);
    setIsCompleted(false);
    setCurrentMousePos(null);
  };

  return (
    <div className="WitnessGame-overlay">
      <div className="WitnessGame-container">
        <div className="WitnessGame-header">
          <h2>The Witness</h2>
          <button className="WitnessGame-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="WitnessGame-content">
          <div className="WitnessGame-instructions">
            <p>Draw a path from the blue dot to the green dot.</p>
            <button onClick={handleReset} className="WitnessGame-reset">
              Reset
            </button>
          </div>
          <canvas
            ref={canvasRef}
            className="WitnessGame-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </div>
      </div>
    </div>
  );
}

export default WitnessGame;
