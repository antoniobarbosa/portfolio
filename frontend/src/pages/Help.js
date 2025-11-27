import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../translations';
import './Page.css';

function Help() {
  const { language } = useLanguage();
  const t = getTranslation(language);

  return (
    <div className="Page">
      <h1>{t.help.title}</h1>
      
      <section className="Page-content">
        <div className="Help-section">
          <h2>{t.help.howToNavigate}</h2>
          <p>{t.help.howToNavigateText}</p>
        </div>
        
        <div className="Help-section">
          <h2>{t.help.faq}</h2>
          <div className="Help-faq">
            <h3>{t.help.faq1Question}</h3>
            <p>{t.help.faq1Answer}</p>
            
            <h3>{t.help.faq2Question}</h3>
            <p>{t.help.faq2Answer}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Help;

