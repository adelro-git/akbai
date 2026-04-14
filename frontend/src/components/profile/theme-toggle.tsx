'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Read initial state from DOM (set by inline script in layout.tsx)
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);
  }, []);

  const toggle = () => {
    const newDark = !dark;
    setDark(newDark);

    if (newDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('akbai-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('akbai-theme', 'light');
    }
  };

  return (
    <div className="flex items-center justify-between" data-testid="theme-toggle-row">
      <div className="flex items-center gap-2">
        {dark ? (
          <Moon className="w-4 h-4 text-on-surface-variant" />
        ) : (
          <Sun className="w-4 h-4 text-on-surface-variant" />
        )}
        <p className="text-sm text-on-surface">Dark mode</p>
      </div>
      <button
        type="button"
        onClick={toggle}
        className={`relative inline-flex items-center h-7 w-12 shrink-0 rounded-full transition-colors ${
          dark ? 'bg-primary-container' : 'bg-surface-container-high'
        }`}
        role="switch"
        aria-checked={dark}
        data-testid="theme-toggle"
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-surface-container-lowest shadow transition-transform ${
            dark ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
