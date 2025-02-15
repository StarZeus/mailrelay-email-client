import { Menu, Star, FileText, Send, Check, Trash } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import Link from 'next/link';

export function NavMenu() {
  return (
    <nav className="flex flex-col space-y-4">
      <Link
        href="/f/inbox"
        className="flex items-center space-x-1 text-gray-700 hover:bg-gray-100 p-2 pl-4 rounded"
      >
        <Menu size={20} />
        <span>Inbox</span>
      </Link>
      <Link
        href="/f/filters"
        className="flex items-center space-x-1 text-gray-700 hover:bg-gray-100 p-2 pl-4 rounded"
      >
        <FileText size={20} />
        <span>Filters & Actions</span>
      </Link>
      <Link
        href="/f/sent"
        className="flex items-center space-x-1 text-gray-700 hover:bg-gray-100 p-2 pl-4 rounded"
      >
        <Send size={20} />
        <span>Sent Mail</span>
      </Link>
      <Link
        href="/f/processed"
        className="flex items-center space-x-1 text-gray-700 hover:bg-gray-100 p-2 pl-4 rounded"
      >
        <Check size={20} />
        <span>Processed</span>
      </Link>
    </nav>
  );
}
