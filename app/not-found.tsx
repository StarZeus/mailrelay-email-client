'use client';

import { ClientWrapper } from '@/app/components/client-wrapper';

function NotFoundContent() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="mt-4">Page not found</p>
      </div>
    </div>
  );
}

export default function NotFound() {
  return (
    <ClientWrapper>
      <NotFoundContent />
    </ClientWrapper>
  );
} 