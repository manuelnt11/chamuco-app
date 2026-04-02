'use client';

import { WifiSlash } from '@phosphor-icons/react';

export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center space-y-6">
        <WifiSlash className="mx-auto h-24 w-24 text-muted-foreground" weight="duotone" />

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">You&apos;re Offline</h1>
          <p className="text-muted-foreground">
            No internet connection detected. Some features may be unavailable.
          </p>
        </div>

        <button
          onClick={handleRetry}
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
