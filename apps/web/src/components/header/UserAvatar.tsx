'use client';

import { UserCircleIcon } from '@phosphor-icons/react';

export function UserAvatar() {
  // TODO: Connect to user profile menu when authentication is implemented
  // This placeholder will open a dropdown with profile options, settings, and sign out
  return (
    <button
      className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="User menu"
      title="User menu"
    >
      <UserCircleIcon className="h-8 w-8" weight="regular" />
    </button>
  );
}
