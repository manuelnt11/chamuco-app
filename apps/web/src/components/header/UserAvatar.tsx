'use client';

import { UserCircle } from '@phosphor-icons/react';

export function UserAvatar() {
  return (
    <button
      className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="User menu"
      title="User menu"
    >
      <UserCircle className="h-8 w-8" weight="regular" />
    </button>
  );
}
