'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { NavMenu } from './menu';
import Link from 'next/link';
import { PenSquare, Search } from 'lucide-react';

export function ThreadHeader({
    folderName,
    count,
  }: {
    folderName: string;
    count?: number | undefined;
  }) {
    return (
      <div className="flex items-center justify-between p-4 border-b border-gray-200 h-[70px]">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold flex items-center capitalize">
            {folderName}
            <span className="ml-2 text-sm text-gray-400">{count}</span>
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href={`/f/${folderName}/new`}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <PenSquare size={18} />
          </Link>
          <Link
            href="/search"
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <Search size={18} />
          </Link>
        </div>
      </div>
    );
  }