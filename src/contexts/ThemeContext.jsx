import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

// Resolves 'system'|'light'|'dark' pref to actual 'light'|'dark'
function resolveTheme(pref) {
  if (pref === 'light') return 'light';
  if (pref === 'dark') return 'dark';
  // 'system'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [pref, setPref] = useState(() => localStorage.getItem('theme-pref') || 'light');
  const [resolved, setResolved] = useState(() => resolveTheme(localStorage.getItem('theme-pref') || 'light'));

  // Apply theme to <html>
  useEffect(() => {
    const next = resolveTheme(pref);
    setResolved(next);
    document.documentElement.setAttribute('data-theme', next);
    document.documentElement.style.colorScheme = next;
  }, [pref]);

  // Listen to system preference changes (only matters when pref === 'system')
  useEffect(() => {
    if (pref !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const next = mq.matches ? 'dark' : 'light';
      setResolved(next);
      document.documentElement.setAttribute('data-theme', next);
      document.documentElement.style.colorScheme = next;
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [pref]);

  const setTheme = useCallback((newPref) => {
    localStorage.setItem('theme-pref', newPref);
    setPref(newPref);
  }, []);

  return (
    <ThemeContext.Provider value={{ pref, resolved, setTheme, isDark: resolved === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}
