// client/src/components/landing/SecuritySection.tsx

// Security & data protection section emphasizing tenant isolation, token safety, and client-side processing.

import * as React from 'react';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck, Lock, CheckCircle2, FileSpreadsheet } from 'lucide-react';

export function SecuritySection() {
  return (
    <section id="security" className="landing-section border-t border-border-subtle">
      <div className="rounded-3xl border border-border-subtle bg-surface p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-xl">
          <Badge variant="brand">Bank-Grade Safeguards</Badge>
          <h2 className="text-2xl sm:text-3xl font-bold text-fg">
            Your Financial Privacy & Data Integrity Come First
          </h2>
          <p className="text-sm sm:text-base text-fg-muted leading-relaxed">
            Every balance update is protected by atomic balance reconciliation. Your sessions use
            short-lived JWT access tokens and 6-digit email OTP codes. Client-side exports mean your
            private financial statements are compiled directly in your browser.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-medium text-fg">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-600" />
              <span>Strict Tenant Isolation</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-brand-600" />
              <span>Secure OTP Verification</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
              <span>Zod Input Validation</span>
            </div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-brand-600" />
              <span>Client-Side PDF/CSV</span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-auto shrink-0 flex flex-col items-center justify-center p-6 rounded-2xl bg-surface-muted border border-border-subtle text-center space-y-3">
          <ShieldCheck className="w-12 h-12 text-brand-600" />
          <div className="font-semibold text-fg">Security Verified</div>
          <div className="text-xs text-fg-muted max-w-[200px]">
            Multi-layer protection across Express REST API and Next.js frontend.
          </div>
        </div>
      </div>
    </section>
  );
}
