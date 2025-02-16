'use client';

import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 p-6">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <h2 className="text-lg font-semibold text-red-800">Something went wrong!</h2>
        <p className="mt-2 text-red-700">{error.message}</p>
        <Button
          onClick={reset}
          variant="outline"
          className="mt-4"
        >
          Try again
        </Button>
      </div>
    </div>
  );
} 