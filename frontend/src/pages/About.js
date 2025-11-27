import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../translations';
import './Page.css';

function About() {
  const { language } = useLanguage();
  const t = getTranslation(language);

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

