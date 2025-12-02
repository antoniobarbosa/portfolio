import React, { useState, useEffect } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { getTranslation } from "../translations";
import ApplicationCarousel from "../components/ApplicationCarousel";
import "./Page.css";

const UNLOCKED_APPS_KEY = "portfolio_unlocked_apps";

function Labs() {
  const { language } = useLanguage();
  const t = getTranslation(language);
  const [unlockedApps, setUnlockedApps] = useState(() => {
    const saved = localStorage.getItem(UNLOCKED_APPS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Escuta eventos de desbloqueio
  useEffect(() => {
    const handleUnlock = () => {
      const saved = localStorage.getItem(UNLOCKED_APPS_KEY);
      setUnlockedApps(saved ? JSON.parse(saved) : []);
    };

    window.addEventListener("apps-unlocked", handleUnlock);
    return () => window.removeEventListener("apps-unlocked", handleUnlock);
  }, []);

  // Dados das aplicações
  const allApplications = [
    {
      title: t.labs.app1?.title || "Aplicação 1",
      description:
        t.labs.app1?.description ||
        "Descrição da primeira aplicação experimental.",
      technologies: ["React", "Node.js", "CSS3"],
      image: null, // Pode adicionar URL da imagem
      link: null, // Pode adicionar link para a aplicação
    },
    {
      title: t.labs.app2?.title || "Aplicação 2",
      description:
        t.labs.app2?.description ||
        "Descrição da segunda aplicação experimental.",
      technologies: ["JavaScript", "HTML5", "API"],
      image: null,
      link: null,
    },
    {
      title: t.labs.app3?.title || "Aplicação 3",
      description:
        t.labs.app3?.description ||
        "Descrição da terceira aplicação experimental.",
      technologies: ["TypeScript", "React", "WebGL"],
      image: null,
      link: null,
    },
    {
      title: t.labs.app4?.title || "Store",
      description:
        t.labs.app4?.description ||
        "Buy upgrades and power-ups with your clicks.",
      technologies: ["React", "LocalStorage", "Game Economy"],
      image: null,
      link: null,
    },
    {
      id: "witness",
      title: t.labs.app5?.title || "The Witness",
      description:
        t.labs.app5?.description ||
        "A mysterious application that observes and records.",
      technologies: ["React", "Canvas", "Puzzle"],
      image: null,
      link: null,
      requiresUnlock: true,
    },
  ];

  // Filtra aplicações baseado no desbloqueio
  const applications = allApplications.filter((app) => {
    if (app.requiresUnlock && app.id) {
      return unlockedApps.includes(app.id);
    }
    return true; // Aplicações sem requiresUnlock sempre aparecem
  });

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
