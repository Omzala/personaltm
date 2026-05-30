import React, { useEffect, useState } from 'react';
import { Plane } from 'lucide-react';
import Hyperspeed from '../components/Hyperspeed.jsx';
import { ThemeToggle } from '../components/ThemeToggle.jsx';
import { getHyperspeedOptions } from '../components/hyperspeedOptions.js';

export function LandingPage({ theme, toggleTheme, onStart }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="landing-root">
      <div className="landing-hyperspeed">
        <Hyperspeed effectOptions={getHyperspeedOptions(theme)} />
      </div>

      <nav className={`landing-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="landing-nav-inner">
          <a className="landing-brand" href="#top">
            <span className="landing-logo">
              <Plane size={18} />
            </span>
            <strong>9to5Wrapped</strong>
          </a>

          <div className="landing-nav-actions">
            {toggleTheme && (
              <ThemeToggle theme={theme} onToggle={toggleTheme} />
            )}
            <button className="ghost-button landing-signin" onClick={() => onStart('signin')}>Sign in</button>
            <button className="primary-button" onClick={() => onStart('signup')}>Sign up</button>
          </div>
        </div>
      </nav>

      <main className="landing landing-minimal" id="top">
        <header className="landing-hero">
          <span className="landing-badge"><b>NEW</b> Just shipped v2.0</span>

          <h1>
            Daily Task Report Hoo Payaga ?,<br />
            <span className="landing-grad">POOOOKAAA! </span>
          </h1>

          <div className="landing-cta">
            <button className="primary-button landing-cta-main" onClick={() => onStart('signup')}>
              Get started
            </button>
            <button className="secondary-button" onClick={() => onStart('signin')}>
              Learn more
            </button>
          </div>
        </header>
      </main>
    </div>
  );
}
