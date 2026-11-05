// client/src/app/(dashboard)/settings/page.tsx

// User settings page coordinating profile management, currency/theme preferences, password updates, and demo data seeding.

'use client';

import { DemoDataCard } from '@/components/settings/DemoDataCard';
import { PasswordCard } from '@/components/settings/PasswordCard';
import { PreferencesCard } from '@/components/settings/PreferencesCard';
import { ProfileCard } from '@/components/settings/ProfileCard';
import * as React from 'react';

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-fg">Account Settings</h2>
        <p className="mt-1 text-sm text-fg-muted">
          Manage your personal profile, regional preferences, security, and demo data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProfileCard />
        <PreferencesCard />
        <PasswordCard />
        <DemoDataCard />
      </div>
    </div>
  );
}
