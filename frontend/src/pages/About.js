import React, { useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../translations';
import { achievementManager } from '../core';
import './Page.css';

function About() {
  const { language } = useLanguage();
  const t = getTranslation(language);
  const intervalRef = useRef(null);
  const counterRef = useRef(0);

  useEffect(() => {
    // Reseta o contador quando entra na página
    counterRef.current = 0;

    // Cria interval que incrementa a cada segundo
    intervalRef.current = setInterval(() => {
      counterRef.current += 1;

      // Quando chegar a 10, adiciona achievement cumulativo
      if (counterRef.current >= 10) {
        achievementManager.addCumulativeAchievement("wait_about", 3);
        // Reseta o contador após adicionar o achievement
        counterRef.current = 0;
      }
    }, 1000); // 1 segundo

    // Limpa o interval quando sair da página
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      counterRef.current = 0;
    };
  }, []);

  return (
    <div className="Page">
      <h1>{t.about.title}</h1>
      
      <section className="Page-content">
        <h2>{t.about.whoIAm}</h2>
        <p>{t.about.whoIAmText}</p>
        
        <h2>{t.about.skills}</h2>
        <ul>
          {t.about.skillsList.map((skill, index) => (
            <li key={index}>{skill}</li>
          ))}
        </ul>
        
        <h2>{t.about.experience}</h2>
        <p>{t.about.experienceText}</p>
      </section>
    </div>
  );
}

export default About;

