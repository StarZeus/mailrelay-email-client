'use client';

import { Suspense, ReactNode } from 'react';

export function ClientWrapper({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    }>
      {children}
    </Suspense>
  );
} 