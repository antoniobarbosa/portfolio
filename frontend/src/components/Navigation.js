import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../translations';
import { eventBus } from '../core';
import './Navigation.css';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const t = getTranslation(language);

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const handleNavigation = (e, path, name) => {
    e.preventDefault();
    
    // Emite evento de navegação com informações do elemento
    eventBus.emit('USER_NAVIGATE', {
      id: e.currentTarget.id || `nav-${name.toLowerCase()}`,
      path: path,
      element: e.currentTarget.className,
      text: e.currentTarget.textContent?.trim(),
    });
    
    // Navega
    navigate(path);
  };

  const handleLanguageToggle = (e) => {
    // Emite evento de clique no botão de idioma
    eventBus.emit('USER_CLICK', {
      id: e.currentTarget.id || 'language-toggle',
      element: e.currentTarget.className,
      action: 'toggle-language',
    });
    
    toggleLanguage();
  };

  return (
    <nav className="Navigation">
      <div className="Navigation-container">
        <div className="Navigation-links">
          <Link 
            to="/" 
            id="nav-home"
            className={`Navigation-link ${isActive('/')}`}
            onClick={(e) => handleNavigation(e, '/', 'home')}
          >
            {t.nav.home}
          </Link>
          <Link 
            to="/about" 
            id="nav-about"
            className={`Navigation-link ${isActive('/about')}`}
            onClick={(e) => handleNavigation(e, '/about', 'about')}
          >
            {t.nav.about}
          </Link>
          <Link 
            to="/contact" 
            id="nav-contact"
            className={`Navigation-link ${isActive('/contact')}`}
            onClick={(e) => handleNavigation(e, '/contact', 'contact')}
          >
            {t.nav.contact}
          </Link>
          <Link 
            to="/help" 
            id="nav-help"
            className={`Navigation-link ${isActive('/help')}`}
            onClick={(e) => handleNavigation(e, '/help', 'help')}
          >
            {t.nav.help}
          </Link>
          <Link 
            to="/events" 
            id="nav-events"
            className={`Navigation-link ${isActive('/events')}`}
            onClick={(e) => handleNavigation(e, '/events', 'events')}
          >
            {t.nav.events}
          </Link>
          <Link 
            to="/gamestates" 
            id="nav-gamestates"
            className={`Navigation-link ${isActive('/gamestates')}`}
            onClick={(e) => handleNavigation(e, '/gamestates', 'gamestates')}
          >
            {t.nav.gamestates}
          </Link>
        </div>
        <button 
          id="language-toggle"
          className="Language-toggle" 
          onClick={handleLanguageToggle}
        >
          {language === 'en' ? 'FR' : 'EN'}
        </button>
      </div>
    </nav>
  );
}

export default Navigation;

