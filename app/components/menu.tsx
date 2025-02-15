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
    <Sheet>
      <SheetTrigger asChild>
        <button className="hover:bg-gray-100 p-2 mr-2 -ml-1 rounded-full">
          <Menu size={20} />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[300px] sm:w-[400px] transition-transform duration-200 ease-out data-[state=open]:duration-200 data-[state=open]:ease-out"
      >
        <SheetTitle>Menu</SheetTitle>
        <nav className="flex flex-col space-y-4 mt-8">
          <Link
            href="/f/inbox"
            className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 p-2 rounded"
          >
            <Menu size={20} />
            <span>Inbox</span>
          </Link>
          <Link
            href="/f/filters"
            className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 p-2 rounded"
          >
            <FileText size={20} />
            <span>Filters & Actions</span>
          </Link>
          <Link
            href="/f/sent"
            className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 p-2 rounded"
          >
            <Send size={20} />
            <span>Sent Mail</span>
          </Link>
          <Link
            href="/f/processed"
            className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 p-2 rounded"
          >
            <Check size={20} />
            <span>Processed</span>
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
