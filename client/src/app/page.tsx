// client/src/app/page.tsx

// Home landing page with initial welcome heading, theme toggle, and action links.

import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function HomePage() {
  return (
    <main className="hero-container">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="hero-title">Antigravity Finance Tracker</h1>
      <p className="hero-subtitle">
        Multi-currency financial management with atomic reconciliation, budgets, and smart
        analytics.
      </p>
    </main>
  );
}
