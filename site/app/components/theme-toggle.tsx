'use client';

import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === 'dark');
  }, []);

  function toggleTheme() {
    const next = !dark;
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    localStorage.setItem('korhaztukor-theme', next ? 'dark' : 'light');
    setDark(next);
  }

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? 'Világos téma bekapcsolása' : 'Sötét téma bekapcsolása'}
      title={dark ? 'Világos téma' : 'Sötét téma'}
    >
      <span className="theme-sun" aria-hidden="true">☼</span>
      <span className="theme-moon" aria-hidden="true">◐</span>
    </button>
  );
}
