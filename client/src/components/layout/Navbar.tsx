// client/src/components/layout/Navbar.tsx

// Top navigation bar providing mobile menu toggle, current view heading, and user sign-out action.

'use client';

import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { LogOut, Menu } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/accounts': 'Accounts & Wallets',
  '/transactions': 'Transactions',
  '/budgets': 'Budgets & Limits',
  '/settings': 'Settings & Preferences',
};

export interface NavbarProps {
  onOpenMobileNav: () => void;
}

export function Navbar({ onOpenMobileNav }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const title =
    PAGE_TITLES[pathname] ||
    Object.entries(PAGE_TITLES).find(([route]) => pathname.startsWith(route))?.[1] ||
    'Dashboard';

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border-subtle bg-surface/85 px-4 backdrop-blur-md sm:px-6">
      {/* Left: Mobile Menu Toggle & Page Heading */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="focus-ring rounded-lg p-2 text-fg-muted hover:bg-surface-hover hover:text-fg md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold tracking-tight text-fg sm:text-xl">{title}</h1>
      </div>

      {/* Right: User Greeting & Sign Out Button */}
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-fg-muted sm:inline">
          Signed in as <strong className="text-fg">{user?.name?.split(' ')[0] || 'User'}</strong>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          isLoading={isLoggingOut}
          disabled={isLoggingOut}
          onClick={handleSignOut}
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
