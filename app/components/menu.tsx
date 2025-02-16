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
            ? 'bg-accent text-accent-foreground'
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
            ? 'bg-accent text-accent-foreground'
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
            ? 'bg-accent text-accent-foreground'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Settings size={20} />
        <span className="pl-2">Filters & Actions</span>
      </Link>
    </nav>
  );
}
