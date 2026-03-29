import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem('f1app-theme');
  if (stored === 'light') return 'light';
  // Respect OS preference on first visit
  if (!stored && window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
  return 'dark';
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('f1app-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return { theme, toggleTheme };
}
