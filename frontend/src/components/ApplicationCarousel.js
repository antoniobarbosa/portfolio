import React, { useState, useEffect } from "react";
import "./ApplicationCarousel.css";
import PortalGame from "./PortalGame";
import CountdownTimer from "./CountdownTimer";
import Store from "./Store";
import WitnessGame from "./WitnessGame";
import { useLanguage } from "../contexts/LanguageContext";
import { getTranslation } from "../translations";

const CLICKER_STORAGE_KEY = "portfolio_clicker_count";
const CLICK_MULTIPLIER_KEY = "portfolio_click_multiplier";

function ApplicationCarousel({ applications }) {
  const { language } = useLanguage();
  const t = getTranslation(language);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPortalGame, setShowPortalGame] = useState(false);
  const [showWitnessGame, setShowWitnessGame] = useState(false);

  // Carrega o contador do localStorage ao montar
  const [clickerCount, setClickerCount] = useState(() => {
    const saved = localStorage.getItem(CLICKER_STORAGE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });

  // Carrega o multiplicador do localStorage
  const [clickMultiplier, setClickMultiplier] = useState(() => {
    const saved = localStorage.getItem(CLICK_MULTIPLIER_KEY);
    return saved ? parseInt(saved, 10) : 1;
  });

  // Salva o contador no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(CLICKER_STORAGE_KEY, clickerCount.toString());
  }, [clickerCount]);

  // Escuta mudanças no multiplicador (vindas da store)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === CLICK_MULTIPLIER_KEY) {
        const saved = localStorage.getItem(CLICK_MULTIPLIER_KEY);
        setClickMultiplier(saved ? parseInt(saved, 10) : 1);
      }
    };

    window.addEventListener("storage", handleStorageChange);

    // Verifica periodicamente também (para mesma aba)
    const checkInterval = setInterval(() => {
      const saved = localStorage.getItem(CLICK_MULTIPLIER_KEY);
      const multiplier = saved ? parseInt(saved, 10) : 1;
      if (multiplier !== clickMultiplier) {
        setClickMultiplier(multiplier);
      }
    }, 500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(checkInterval);
    };
  }, [clickMultiplier]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === applications.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? applications.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (!applications || applications.length === 0) {
    return null;
  }

  const currentApp = applications[currentIndex];

  return (
    <>
      {showPortalGame && (
        <PortalGame onClose={() => setShowPortalGame(false)} />
      )}
      {showWitnessGame && (
        <WitnessGame onClose={() => setShowWitnessGame(false)} />
      )}
      <div className="ApplicationCarousel">
        <div className="ApplicationCarousel-container">
          <button
            className="ApplicationCarousel-button ApplicationCarousel-button--prev"
            onClick={prevSlide}
            aria-label="Aplicação anterior"
          >
            ‹
          </button>

          <div className="ApplicationCarousel-slide">
            <div className="ApplicationCarousel-card">
              {currentApp.image && (
                <div className="ApplicationCarousel-image">
                  <img src={currentApp.image} alt={currentApp.title} />
                </div>
              )}
              <div className="ApplicationCarousel-content">
                <h3 className="ApplicationCarousel-title">
                  {currentApp.title}
                </h3>
                <p className="ApplicationCarousel-description">
                  {currentApp.description}
                </p>
                {currentApp.technologies && (
                  <div className="ApplicationCarousel-technologies">
                    {currentApp.technologies.map((tech, index) => (
                      <span key={index} className="ApplicationCarousel-tech">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {currentIndex === 0 ? (
                  <button
                    onClick={() => setShowPortalGame(true)}
                    className="ApplicationCarousel-link ApplicationCarousel-button-link"
                  >
                    Play Portal →
                  </button>
                ) : currentIndex === 1 ? (
                  <div className="ApplicationCarousel-clicker">
                    <div className="ApplicationCarousel-clicker-counter">
                      <span className="ApplicationCarousel-clicker-count">
                        {clickerCount}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setClickerCount((prev) => prev + clickMultiplier)
                      }
                      className="ApplicationCarousel-clicker-button"
                    >
                      {t.labs.app2?.clickHere || "Click Here"}
                    </button>
                    {clickMultiplier > 1 && (
                      <p className="ApplicationCarousel-clicker-multiplier">
                        +{clickMultiplier} per click
                      </p>
                    )}
                  </div>
                ) : currentIndex === 2 ? (
                  <CountdownTimer />
                ) : currentIndex === 3 ? (
                  <Store
                    clickerCount={clickerCount}
                    setClickerCount={setClickerCount}
                    setClickMultiplier={setClickMultiplier}
                  />
                ) : currentApp.id === "witness" ? (
                  <button
                    onClick={() => setShowWitnessGame(true)}
                    className="ApplicationCarousel-link ApplicationCarousel-button-link"
                  >
                    Play The Witness →
                  </button>
                ) : currentApp.link ? (
                  <a
                    href={currentApp.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ApplicationCarousel-link"
                  >
                    Ver aplicação →
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <button
            className="ApplicationCarousel-button ApplicationCarousel-button--next"
            onClick={nextSlide}
            aria-label="Próxima aplicação"
          >
            ›
          </button>
        </div>

        <div className="ApplicationCarousel-dots">
          {applications.map((_, index) => (
            <button
              key={index}
              className={`ApplicationCarousel-dot ${
                index === currentIndex ? "ApplicationCarousel-dot--active" : ""
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Ir para aplicação ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default ApplicationCarousel;
