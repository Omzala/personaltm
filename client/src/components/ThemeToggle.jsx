import React from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle({ theme, onToggle, className = '' }) {
  const isDark = theme === 'dark';

  return (
    <button
      className={`theme-switch ${isDark ? 'is-dark' : 'is-light'} ${className}`.trim()}
      onClick={onToggle}
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
    >
      <span className="theme-switch-track" aria-hidden="true">
        <span className="theme-switch-icon sun-icon">
          <Sun size={13} />
        </span>
        <span className="theme-switch-icon moon-icon">
          <Moon size={13} />
        </span>
        <span className="theme-switch-thumb">
          {isDark ? <Moon size={14} /> : <Sun size={14} />}
        </span>
      </span>
    </button>
  );
}
