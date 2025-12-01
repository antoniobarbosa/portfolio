import React, { useState } from "react";
import "./ApplicationCarousel.css";
import PortalGame from "./PortalGame";

function ApplicationCarousel({ applications }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPortalGame, setShowPortalGame] = useState(false);

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
