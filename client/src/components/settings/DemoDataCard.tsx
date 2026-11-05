// client/src/components/settings/DemoDataCard.tsx

// Demo data generator settings card for seeding sample accounts, budgets, and transactions into the user's workspace.

'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Toast } from '@/components/ui/Toast';
import { apiClient } from '@/lib/api';
import { Database, Sparkles } from 'lucide-react';
import * as React from 'react';

export function DemoDataCard() {
  const [isLoadingDemo, setIsLoadingDemo] = React.useState(false);
  const [demoMessage, setDemoMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleLoadDemoData = async () => {
    setDemoMessage(null);
    setIsLoadingDemo(true);
    try {
      const res = await apiClient<{
        success: boolean;
        message: string;
        data: { accountsCreated: number; budgetsCreated: number; transactionsCreated: number };
      }>('/users/demo-data', {
        method: 'POST',
      });
      setDemoMessage({
        type: 'success',
        text: `Loaded ${res.data.accountsCreated} accounts, ${res.data.budgetsCreated} budgets, and ${res.data.transactionsCreated} demo transactions!`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load demo data.';
      setDemoMessage({ type: 'error', text: message });
    } finally {
      setIsLoadingDemo(false);
    }
  };

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <span>Demo Financial Data</span>
        </span>
      }
      description="Populate realistic sample accounts, budgets, and transactions."
    >
      {demoMessage && (
        <Toast variant={demoMessage.type} message={demoMessage.text} className="mb-4" />
      )}

      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-border-subtle bg-surface-muted/50 p-4 text-sm text-fg-muted">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 h-5 w-5 shrink-0 text-brand-600 dark:text-brand-400" />
            <div>
              <p className="font-semibold text-fg">Sample Workspace Data</p>
              <p className="mt-1 text-xs">
                Seeds 4 accounts (Cash, Bank Checking, bKash, Credit Card), 4 category budgets, and
                12+ realistic transactions over the last 30 days. Perfect for exploring charts,
                analytics, and filters.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border-subtle pt-4">
          <span className="text-xs text-fg-subtle">
            Safe to load at any time without overwriting your profile.
          </span>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleLoadDemoData}
            isLoading={isLoadingDemo}
            disabled={isLoadingDemo}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Load Demo Data</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
