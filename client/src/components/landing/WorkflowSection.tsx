// client/src/components/landing/WorkflowSection.tsx

// Three-step workflow section illustrating setup, transaction tracking/OCR, and analytics.

import * as React from 'react';
import { Badge } from '@/components/ui/Badge';

export function WorkflowSection() {
  return (
    <section
      id="how-it-works"
      className="landing-section border-t border-border-subtle bg-surface/40"
    >
      <div className="text-center max-w-3xl mx-auto mb-14">
        <Badge variant="brand" className="mb-3">
          Workflow
        </Badge>
        <h2 className="text-3xl font-bold tracking-tight text-fg sm:text-4xl">
          Simplicity by Design
        </h2>
        <p className="mt-4 text-fg-muted">
          Three simple steps to gain complete mastery over your personal cash flow.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface border border-border-subtle space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
            1
          </div>
          <h3 className="font-semibold text-lg text-fg">Setup Your Wallets</h3>
          <p className="text-sm text-fg-muted">
            Add checking accounts, cash in hand, bKash, or credit cards in your native currencies.
          </p>
        </div>

        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface border border-border-subtle space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
            2
          </div>
          <h3 className="font-semibold text-lg text-fg">Record & Scan</h3>
          <p className="text-sm text-fg-muted">
            Log transactions manually or drag-and-drop receipt snapshots for instant AI scanning.
          </p>
        </div>

        <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-surface border border-border-subtle space-y-3">
          <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
            3
          </div>
          <h3 className="font-semibold text-lg text-fg">Analyze & Export</h3>
          <p className="text-sm text-fg-muted">
            Monitor monthly budgets, watch your savings rate rise, and download PDF statements.
          </p>
        </div>
      </div>
    </section>
  );
}
