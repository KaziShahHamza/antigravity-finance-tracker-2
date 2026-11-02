// client/src/app/page.tsx

// Home landing page with initial welcome heading and action links.

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
        Antigravity Finance Tracker
      </h1>
      <p className="mt-4 max-w-lg text-slate-600 dark:text-slate-400">
        Multi-currency financial management with atomic reconciliation, budgets, and smart
        analytics.
      </p>
    </main>
  );
}
