// client/src/app/layout.tsx

// Root HTML layout establishing font, styling, ThemeProvider, and metadata for the application.

import { ThemeProvider } from '@/context/ThemeProvider';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Antigravity Finance Tracker',
  description: 'Track multi-currency wallets, budgets, transactions, and analytics.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="page-shell">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
