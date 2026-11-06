// client/src/app/layout.tsx

// Root HTML layout establishing font, styling, ThemeProvider, QueryProvider, and metadata for the application.

import { AuthProvider } from '@/context/AuthContext';
import { CurrencyProvider } from '@/context/CurrencyContext';
import { QueryProvider } from '@/context/QueryProvider';
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
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <CurrencyProvider>{children}</CurrencyProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
