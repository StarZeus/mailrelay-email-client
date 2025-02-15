'use client';

import { MoreHorizontal, Archive, Trash2 } from 'lucide-react';

interface ThreadActionsProps {
  threadId: number;
}

export function ThreadActions({ threadId }: ThreadActionsProps) {
  return (
    <div className="flex items-center space-x-2">
      <button className="p-2 hover:bg-gray-100 rounded-full">
        <Archive size={18} />
      </button>
      <button className="p-2 hover:bg-gray-100 rounded-full">
        <Trash2 size={18} />
      </button>
      <button className="p-2 hover:bg-gray-100 rounded-full">
        <MoreHorizontal size={18} />
      </button>
    </div>
  );
}
