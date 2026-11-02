// client/src/components/layout/ThemeToggle.tsx

// Hydration-safe light/dark/system mode toggle button guarded by mounted state.

'use client';

import { Laptop, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Guard initial render to prevent server HTML vs client hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="h-9 w-9 rounded-lg border border-slate-200 bg-transparent dark:border-slate-800"
        aria-hidden="true"
      />
    );
  }

  const cycleTheme = () => {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus:ring-offset-slate-950"
      aria-label={`Toggle theme, current theme is ${theme}`}
      title={`Theme: ${theme}`}
    >
      {theme === 'light' && <Sun className="h-4 w-4" />}
      {theme === 'dark' && <Moon className="h-4 w-4" />}
      {theme === 'system' && <Laptop className="h-4 w-4" />}
    </button>
  );
}
