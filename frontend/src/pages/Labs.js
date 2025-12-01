import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../translations';
import ApplicationCarousel from '../components/ApplicationCarousel';
import './Page.css';

function Labs() {
  const { language } = useLanguage();
  const t = getTranslation(language);

  // Dados das aplicações
  const applications = [
    {
      title: t.labs.app1?.title || "Aplicação 1",
      description: t.labs.app1?.description || "Descrição da primeira aplicação experimental.",
      technologies: ["React", "Node.js", "CSS3"],
      image: null, // Pode adicionar URL da imagem
      link: null, // Pode adicionar link para a aplicação
    },
    {
      title: t.labs.app2?.title || "Aplicação 2",
      description: t.labs.app2?.description || "Descrição da segunda aplicação experimental.",
      technologies: ["JavaScript", "HTML5", "API"],
      image: null,
      link: null,
    },
    {
      title: t.labs.app3?.title || "Aplicação 3",
      description: t.labs.app3?.description || "Descrição da terceira aplicação experimental.",
      technologies: ["TypeScript", "React", "WebGL"],
      image: null,
      link: null,
    },
  ];

  return (
    <div className="Page">
      <section className="Page-hero">
        <h1>{t.labs.title}</h1>
        <p className="Page-subtitle">{t.labs.subtitle}</p>
      </section>
      
      <section className="Page-content">
        <h2>{t.labs.experiments}</h2>
        <ApplicationCarousel applications={applications} />
      </section>
    </div>
  );
}

export default Labs;

