// client/src/components/dashboard/TimeGreeting.tsx

// Hydration-safe local time clock and personalized AM/PM greeting header component.

'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Clock } from 'lucide-react';

interface TimeGreetingProps {
  userName?: string;
  defaultCurrency: string;
}

export function TimeGreeting({ userName = 'Explorer', defaultCurrency }: TimeGreetingProps) {
  const [mounted, setMounted] = React.useState(false);
  const [timeString, setTimeString] = React.useState('');
  const [greeting, setGreeting] = React.useState('Welcome');

  React.useEffect(() => {
    setMounted(true);

    const updateTimeAndGreeting = () => {
      const now = new Date();
      const hours = now.getHours();

      // Dynamic AM/PM Greeting
      if (hours < 12) {
        setGreeting('Good morning');
      } else if (hours < 18) {
        setGreeting('Good afternoon');
      } else {
        setGreeting('Good evening');
      }

      // 12-hour format with seconds and AM/PM
      setTimeString(
        now.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };

    updateTimeAndGreeting();
    const interval = setInterval(updateTimeAndGreeting, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">
          {mounted ? `${greeting}, ${userName}!` : `Welcome, ${userName}!`}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          Here is your financial overview. Base currency is set to{' '}
          <strong className="text-fg">{defaultCurrency}</strong>.
        </p>
      </div>

      {/* Hydration-safe live local clock badge */}
      <div className="flex items-center">
        {mounted ? (
          <Badge variant="brand" className="gap-1.5 px-3 py-1 text-xs font-mono shadow-sm">
            <Clock className="h-3.5 w-3.5" />
            <span>{timeString}</span>
          </Badge>
        ) : (
          <div className="h-6 w-28 animate-pulse rounded-md bg-surface-muted" />
        )}
      </div>
    </div>
  );
}
