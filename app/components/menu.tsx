import { Menu, Star, FileText, Send, Check, Trash, Mail, MailCheck, MailQuestion, MailCheckIcon, MailOpen, Settings } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import Link from 'next/link';

export function NavMenu() {
  return (
    <nav className="flex flex-col">
      <Link
        href="/f/inbox"
        className="flex items-center space-x-1 text-gray-700 hover:bg-gray-100 px-6 py-4 rounded"
      >
        <Mail size={20} />
        <span className="pl-2">Inbox</span>
      </Link>
      <Link
        href="/f/filters"
        className="flex items-center space-x-1 text-gray-700 hover:bg-gray-100 px-6 py-4 rounded"
      >
        <Settings size={20} />
        <span className="pl-2">Filters & Actions</span>
      </Link>
      <Link
        href="/f/sent"
        className="flex items-center space-x-1 text-gray-700 hover:bg-gray-100 px-6 py-4 rounded"
      >
        <Send size={20} />
        <span className="pl-2">Sent Mail</span>
      </Link>
      <Link
        href="/f/processed"
        className="flex items-center space-x-1 text-gray-700 hover:bg-gray-100 px-6 py-4 rounded"
      >
        <MailCheck size={20} />
        <span className="pl-2">Processed</span>
      </Link>
    </nav>
  );
}
