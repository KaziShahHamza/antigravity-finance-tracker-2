// client/src/app/page.tsx

// Main public landing page composing header, hero, feature showcase, workflow, security, and CTA sections.

import * as React from 'react';
import { LandingHeader } from '@/components/landing/LandingHeader';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { WorkflowSection } from '@/components/landing/WorkflowSection';
import { SecuritySection } from '@/components/landing/SecuritySection';
import { CtaBanner } from '@/components/landing/CtaBanner';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col selection:bg-brand-500/20">
      <LandingHeader />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <WorkflowSection />
        <SecuritySection />
        <CtaBanner />
      </main>
      <LandingFooter />
    </div>
  );
}
