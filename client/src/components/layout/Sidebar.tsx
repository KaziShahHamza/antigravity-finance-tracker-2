// client/src/components/layout/Sidebar.tsx

// Responsive sidebar component providing application navigation links, active states, and user summary.

'use client';

import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeftRight, LayoutDashboard, PieChart, Settings, Wallet, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'Accounts', icon: Wallet },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/budgets', label: 'Budgets', icon: PieChart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export interface SidebarProps {
  onClose?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ onClose, isMobile = false }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <aside
      className={`flex h-full flex-col justify-between border-r border-border-subtle bg-surface ${
        isMobile ? 'w-full p-6' : 'w-64 p-4'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2 pb-6">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="focus-ring flex items-center gap-3 rounded-lg text-lg font-bold tracking-tight text-fg"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
              <Wallet className="h-5 w-5" />
            </span>
            <span>Antigravity</span>
          </Link>
          {isMobile && onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation"
              className="focus-ring rounded-lg p-1.5 text-fg-muted hover:bg-surface-hover hover:text-fg"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Menu */}
        <nav aria-label="Main Navigation" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Info & Controls Footer */}
      <div className="border-t border-border-subtle pt-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex min-w-0 items-center gap-3">
            {user?.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white shadow-sm">
                {userInitial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{user?.name || 'User'}</p>
              <p className="truncate text-xs text-fg-muted">{user?.email || ''}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
