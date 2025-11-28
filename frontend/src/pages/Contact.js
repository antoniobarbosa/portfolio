import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../translations';
import { mouseoverManager } from '../core';
import './Page.css';

function Contact() {
  const { language } = useLanguage();
  const t = getTranslation(language);

  const handleEmailMouseover = () => {
    mouseoverManager.handleMouseover("email", 10);
  };

  const handleLinkedInMouseover = () => {
    mouseoverManager.handleMouseover("linkedin", 10);
  };

  const handleGitHubMouseover = () => {
    mouseoverManager.handleMouseover("github", 10);
  };

  return (
    <div className="Page">
      <h1>{t.contact.title}</h1>
      
      <section className="Page-content">
        <p>{t.contact.description}</p>
        
        <div className="Contact-info">
          <div 
            className="Contact-item" 
            id="contact-email"
            onMouseEnter={handleEmailMouseover}
          >
            <h3>{t.contact.email}</h3>
            <p>contact@example.com</p>
          </div>
          
          <div 
            className="Contact-item"
            id="contact-linkedin"
            onMouseEnter={handleLinkedInMouseover}
          >
            <h3>{t.contact.linkedin}</h3>
            <p>linkedin.com/in/your-profile</p>
          </div>
          
          <div 
            className="Contact-item"
            id="contact-github"
            onMouseEnter={handleGitHubMouseover}
          >
            <h3>{t.contact.github}</h3>
            <p>github.com/your-username</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Contact;

