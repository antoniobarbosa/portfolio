import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../translations';
import GameStartOverlay from '../components/GameStartOverlay';
import './Page.css';

function Home() {
  const { language } = useLanguage();
  const t = getTranslation(language);

  return (
    <div className="Page">
      <GameStartOverlay />
      <section className="Page-hero">
        <h1>{t.home.title}</h1>
        <p className="Page-subtitle">{t.home.subtitle}</p>
      </section>
      
      <section className="Page-content">
        <h2>{t.home.aboutProject}</h2>
        <p>{t.home.description}</p>
      </section>
    </div>
  );
}

export default Home;

