import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import "./ExplosionEffects.css";

const EXPLOSION_STORAGE_KEY = "portfolio_explosions_active";

// Função para verificar se explosões estão ativas
export const isExplosionsActive = () => {
  return localStorage.getItem(EXPLOSION_STORAGE_KEY) === "true";
};

// Função para ativar explosões
export const activateExplosions = () => {
  localStorage.setItem(EXPLOSION_STORAGE_KEY, "true");
  window.dispatchEvent(new CustomEvent("explosions-activated"));
};

// Função para desativar explosões
export const deactivateExplosions = () => {
  localStorage.removeItem(EXPLOSION_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("explosions-deactivated"));
};

function ExplosionEffects() {
  const [isActive, setIsActive] = useState(false);
  const explosionsRef = useRef([]);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);

  // Verifica localStorage continuamente e escuta eventos
  useEffect(() => {
    // Função para verificar e atualizar estado
    const checkAndUpdateState = () => {
      const active = isExplosionsActive();
      setIsActive(active);
    };

    // Verifica estado inicial
    checkAndUpdateState();

    // Verifica periodicamente (a cada 500ms) para garantir que funciona mesmo após navegação
    const checkInterval = setInterval(checkAndUpdateState, 500);

    // Listener para ativação
    const handleActivate = () => {
      setIsActive(true);
    };

    // Listener para desativação
    const handleDeactivate = () => {
      setIsActive(false);
    };

    // Listener para mudanças no storage (caso outra aba mude)
    const handleStorageChange = (e) => {
      if (e.key === EXPLOSION_STORAGE_KEY) {
        checkAndUpdateState();
      }
    };

    window.addEventListener("explosions-activated", handleActivate);
    window.addEventListener("explosions-deactivated", handleDeactivate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      clearInterval(checkInterval);
      window.removeEventListener("explosions-activated", handleActivate);
      window.removeEventListener("explosions-deactivated", handleDeactivate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Cria explosões aleatórias
  useEffect(() => {
    if (!isActive) {
      explosionsRef.current = [];
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Função para criar uma explosão
    const createExplosion = (x, y) => {
      const particles = [];
      const particleCount = 30 + Math.random() * 20;

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const speed = 2 + Math.random() * 4;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 1.0,
          decay: 0.01 + Math.random() * 0.02,
          size: 3 + Math.random() * 5,
          color: `hsl(${Math.random() * 60 + 10}, 100%, ${
            50 + Math.random() * 50
          }%)`,
        });
      }

      explosionsRef.current.push({
        particles,
        startTime: Date.now(),
      });
    };

    // Cria explosões aleatórias periodicamente (mais frequentes)
    const explosionInterval = setInterval(() => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      createExplosion(x, y);
    }, 500 + Math.random() * 1000); // A cada 0.5-1.5 segundos

    // Loop de animação
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Atualiza e desenha todas as explosões
      explosionsRef.current = explosionsRef.current.filter((explosion) => {
        explosion.particles = explosion.particles.filter((particle) => {
          // Atualiza posição
          particle.x += particle.vx;
          particle.y += particle.vy;
          particle.vx *= 0.98; // Fricção
          particle.vy *= 0.98;
          particle.vy += 0.2; // Gravidade
          particle.life -= particle.decay;

          // Desenha partícula
          if (particle.life > 0) {
            ctx.save();
            ctx.globalAlpha = particle.life;
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return true;
          }
          return false;
        });

        // Mantém explosão se ainda tem partículas
        return explosion.particles.length > 0;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Ajusta tamanho do canvas quando a janela redimensiona
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(explosionInterval);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [isActive]);

  if (!isActive) return null;

  return createPortal(
    <canvas ref={canvasRef} className="explosion-canvas" />,
    document.body
  );
}

export default ExplosionEffects;
