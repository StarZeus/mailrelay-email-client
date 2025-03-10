'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, Suspense } from 'react';
import debounce from 'lodash/debounce';
import { ClientWrapper } from './client-wrapper';

function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  const handleSearch = debounce((term: string) => {
    router.push(pathname + '?' + createQueryString('q', term));
  }, 300);

  return (
    <div className="max-w-md w-full relative">
      <Input
        type="search"
        placeholder="Type to search..."
        className="pl-10 focus-visible:ring-blue-500"
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('q') ?? ''}
      />
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
    </div>
  );
}

export function Header() {
  return (
    <ClientWrapper>
      <header className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-end">
        {/* Search */}
        <Suspense fallback={
          <div className="max-w-md w-full relative">
            <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
          </div>
        }>
          <SearchBar />
        </Suspense>
      </header>
    </ClientWrapper>
  );
} 