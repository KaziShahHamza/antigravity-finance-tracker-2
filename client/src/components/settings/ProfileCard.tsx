// client/src/components/settings/ProfileCard.tsx

// User profile settings card managing display name updates, email viewing, and verification status.

'use client';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Toast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import type { User } from '@/types';
import { CheckCircle2, User as UserIcon } from 'lucide-react';
import * as React from 'react';

export function ProfileCard() {
  const { user, updateUser } = useAuth();
  const [name, setName] = React.useState(user?.name || '');
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [profileMessage, setProfileMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  React.useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user?.name]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);

    if (name.trim().length < 2) {
      setProfileMessage({ type: 'error', text: 'Name must be at least 2 characters.' });
      return;
    }

    setIsSavingProfile(true);
    try {
      const res = await apiClient<{ success: boolean; user: User }>('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() }),
      });
      updateUser(res.user);
      setProfileMessage({ type: 'success', text: 'Profile name updated successfully.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile.';
      setProfileMessage({ type: 'error', text: message });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          <span>Personal Profile</span>
        </span>
      }
      description="Update your personal details and view verification status."
    >
      {profileMessage && (
        <Toast variant={profileMessage.type} message={profileMessage.text} className="mb-4" />
      )}

      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xl font-bold text-white shadow-sm">
          {userInitial}
        </div>
        <div>
          <p className="font-semibold text-fg">{user?.name || 'User'}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-fg-muted">{user?.email}</span>
            <Badge variant={user?.isVerified ? 'success' : 'warning'} className="gap-1">
              {user?.isVerified && <CheckCircle2 className="h-3 w-3" />}
              {user?.isVerified ? 'Verified' : 'Unverified'}
            </Badge>
          </div>
        </div>
      </div>

      <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
        <Input
          id="settings-name"
          label="Full Name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSavingProfile}
          required
        />

        <Input
          id="settings-email"
          label="Email Address"
          type="email"
          value={user?.email || ''}
          disabled
          hint="Account email address cannot be modified."
        />

        <div className="mt-2 flex justify-end">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSavingProfile}
            disabled={isSavingProfile || name.trim() === user?.name}
          >
            Save Profile
          </Button>
        </div>
      </form>
    </Card>
  );
}
