// client/src/components/layout/ThemeToggle.tsx

// Hydration-safe light/dark/system mode toggle button using Button primitive.

'use client';

import { Button } from '@/components/ui/Button';
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
    return <div className="btn-icon-placeholder" aria-hidden="true" />;
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
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      aria-label={`Toggle theme, current theme is ${theme}`}
      title={`Theme: ${theme}`}
    >
      {theme === 'light' && <Sun className="h-4 w-4" />}
      {theme === 'dark' && <Moon className="h-4 w-4" />}
      {theme === 'system' && <Laptop className="h-4 w-4" />}
    </Button>
  );
}
