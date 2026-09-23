import { useState, useEffect } from 'react';
import AboutModal from './AboutModal';

export default function Header() {
  const [scrolled, setScrolled]     = useState(false);
  const [aboutOpen, setAboutOpen]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header className={`header${scrolled ? ' scrolled' : ''}`} role="banner">
        <div className="header-inner">
          {/* Logo */}
          <a href="/" className="header-logo" aria-label="AI Deployment Troubleshooter – home">
            <div className="header-logo-icon" aria-hidden="true">⚡</div>
            <span className="header-logo-text">
              AI <span>Deployment</span> Troubleshooter
            </span>
          </a>

          {/* Nav */}
          <nav className="header-nav" aria-label="Primary navigation">
            <span className="nav-badge" aria-label="Application status: online">Online</span>

            <button
              className="nav-link"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              aria-label="Go to Dashboard"
            >
              Dashboard
            </button>

            <button
              className="nav-link"
              onClick={() => setAboutOpen(true)}
              aria-label="Open About dialog"
              aria-haspopup="dialog"
            >
              About
            </button>
          </nav>
        </div>
      </header>

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}
    </>
  );
}
