'use client';
import { Settings, Inbox, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavMenu() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col">
      <Link
        href="/inbox"
        className={`flex items-center space-x-1 px-6 py-4 rounded ${
          pathname === '/inbox'
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Inbox size={20} />
        <span className="pl-2">Inbox</span>
      </Link>
      <Link
        href="/processed"
        className={`flex items-center space-x-1 px-6 py-4 rounded ${
          pathname === '/processed'
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <MailCheck size={20} />
        <span className="pl-2">Processed</span>
      </Link>
      <Link
        href="/settings/filters"
        className={`flex items-center space-x-1 px-6 py-4 rounded ${
          pathname === '/settings/filters'
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Settings size={20} />
        <span className="pl-2">Filters & Actions</span>
      </Link>
    </nav>
  );
}
