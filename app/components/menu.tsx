'use client';
import { Menu, Star, FileText, Send, Check, Trash, Mail, MailCheck, MailQuestion, MailCheckIcon, MailOpen, Settings } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavMenu() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col">
      <Link
        href="/f/inbox"
        className={`flex items-center space-x-1 px-6 py-4 rounded ${
          pathname === '/f/inbox'
            ? 'bg-accent text-accent-foreground'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Mail size={20} />
        <span className="pl-2">Inbox</span>
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
      <Link
        href="/f/sent"
        className={`flex items-center space-x-1 px-6 py-4 rounded ${
          pathname === '/f/sent'
            ? 'bg-accent text-accent-foreground'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Send size={20} />
        <span className="pl-2">Sent Mail</span>
      </Link>
      <Link
        href="/f/processed"
        className={`flex items-center space-x-1 px-6 py-4 rounded ${
          pathname === '/f/processed'
            ? 'bg-accent text-accent-foreground'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <MailCheck size={20} />
        <span className="pl-2">Processed</span>
      </Link>
    </nav>
  );
}
