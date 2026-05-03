import { Suspense, type ReactNode } from 'react';

import { Spinner } from '@/components/ui/spinner';

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center p-8">
          <Spinner size="lg" />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
