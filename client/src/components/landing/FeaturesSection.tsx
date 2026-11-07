// client/src/components/landing/FeaturesSection.tsx

// Features grid section showcasing 6 primary application capabilities in accessible cards.

import * as React from 'react';
import { Badge } from '@/components/ui/Badge';
import {
  Wallet,
  Receipt,
  PieChart,
  BarChart3,
  ArrowRightLeft,
  FileSpreadsheet,
} from 'lucide-react';

export function FeaturesSection() {
  return (
    <section id="features" className="landing-section border-t border-border-subtle">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <Badge variant="brand" className="mb-3">
          Capabilities
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          Engineered for Precision & Financial Freedom
        </h2>
        <p className="mt-4 text-fg-muted">
          Everything you need to handle real-world personal finances, from physical paper receipts
          to multi-currency mobile wallets.
        </p>
      </div>

      <div className="landing-grid">
        {/* Feature 1 */}
        <div className="feature-card">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/80 text-brand-600 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-lg text-fg">Multi-Currency Wallets</h3>
          <p className="text-sm text-fg-muted leading-relaxed">
            Track checking accounts, cash, credit cards, bKash, and Nagad wallets in USD, BDT, EUR,
            GBP, or any global currency with live exchange rates.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="feature-card">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-lg text-fg">AI Receipt Scanning (OCR)</h3>
          <p className="text-sm text-fg-muted leading-relaxed">
            Snap receipt photos on your phone or desktop. Our OCR pipeline automatically extracts
            the vendor, date, line items, and amount with zero manual typing.
          </p>
        </div>

        {/* Feature 3 */}
        <div className="feature-card">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center">
            <PieChart className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-lg text-fg">Budgets & Overspending Alerts</h3>
          <p className="text-sm text-fg-muted leading-relaxed">
            Establish category-specific spending caps. Stay informed with 3-tier visual alert badges
            before you exceed your planned budget.
          </p>
        </div>

        {/* Feature 4 */}
        <div className="feature-card">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-lg text-fg">Visual Cash Flow Analytics</h3>
          <p className="text-sm text-fg-muted leading-relaxed">
            Gain instant perspective through interactive Recharts cash flow bars, net savings rate
            indicators, and category distribution donut charts.
          </p>
        </div>

        {/* Feature 5 */}
        <div className="feature-card">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-lg text-fg">Atomic Balance Transfers</h3>
          <p className="text-sm text-fg-muted leading-relaxed">
            Transfer funds between wallets with guaranteed atomic balance reconciliation, exact
            2-decimal currency rounding, and automatic balance rollback on edits.
          </p>
        </div>

        {/* Feature 6 */}
        <div className="feature-card">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <h3 className="font-semibold text-lg text-fg">Client-Side CSV & PDF Reports</h3>
          <p className="text-sm text-fg-muted leading-relaxed">
            Export bank-grade financial statements in CSV and PDF directly in your browser. Fast,
            privacy-friendly, and memory-safe.
          </p>
        </div>
      </div>
    </section>
  );
}
