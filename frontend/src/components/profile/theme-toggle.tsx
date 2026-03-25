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
        className={`relative w-11 h-6 rounded-full transition-colors ${
          dark ? 'bg-primary-container' : 'bg-surface-container-high border border-outline-variant/30'
        }`}
        role="switch"
        aria-checked={dark}
        data-testid="theme-toggle"
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-surface-container-lowest shadow transition-transform ${
            dark ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}
