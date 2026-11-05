// client/src/app/(dashboard)/layout.tsx

// Protected dashboard shell establishing responsive sidebar, mobile drawer, navbar, and auth route guard.

'use client';

import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Spinner } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import * as React from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Loading state while verifying session
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" label="Checking authentication..." />
          <p className="text-sm font-medium text-fg-muted">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // Not authenticated; render nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex md:w-64 md:shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Slide-Over Drawer Navigation */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-over panel */}
          <div className="relative flex w-full max-w-xs flex-1 flex-col shadow-2xl">
            <Sidebar onClose={() => setMobileNavOpen(false)} isMobile />
          </div>
        </div>
      )}

      {/* Main Content Area with Navbar and Children */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
