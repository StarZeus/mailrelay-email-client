'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PenSquare, Search } from 'lucide-react';
import { NavMenu } from './menu';
import { formatEmailString } from '@/lib/utils';
import { emails, users } from '@/lib/db/schema';
import { ThreadActions } from '@/app/components/thread-actions';
import { useRouter } from 'next/navigation';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { ThreadDetails } from './thread-details';

type Email = Omit<typeof emails.$inferSelect, 'threadId'> & {
  sender: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'>;
};
type User = typeof users.$inferSelect;

type ThreadWithEmails = {
  id: number;
  subject: string | null;
  lastActivityDate: Date | null;
  emails: Email[];
};

interface ThreadListProps {
  folderName: string;
  threads: ThreadWithEmails[];
  searchQuery?: string;
  selectedId?: string;
  selectedThread?: ThreadWithEmails;
}

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

export function ThreadList({ 
  folderName, 
  threads,
  selectedId,
  selectedThread 
}: ThreadListProps) {
  const router = useRouter();
  
  const handleThreadClick = (threadId: number) => {
    router.push(`/f/${folderName}?id=${threadId}`);
  };

  return (
    <PanelGroup direction="horizontal" className="h-full">
      <Panel defaultSize={20} minSize={15} maxSize={25}>
        <div className="h-full border-r border-gray-200">
          <NavMenu />
        </div>
      </Panel>
      
      <PanelResizeHandle className="w-1 hover:bg-gray-200 transition-colors" />
      
      <Panel defaultSize={selectedThread ? 30 : 80} minSize={20}>
        <main className="h-full overflow-y-auto border-x border-gray-200">
          {threads.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center bg-white">
              <p className="text-gray-500 capitalize">{folderName} Empty!</p>
            </div>
          ) : (
            <div className="flex-1">
              {threads.map((thread) => {
                const latestEmail = thread.emails[0];
                const isSelected = selectedId === thread.id.toString();

                return (
                  <button
                    key={thread.id}
                    onClick={() => handleThreadClick(thread.id)}
                    className={`w-full text-left hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                      isSelected ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div className="flex-grow flex items-center overflow-hidden p-4">
                        <div className="w-[200px] flex-shrink-0 mr-4">
                          <span className="font-medium truncate">
                            {formatEmailString(latestEmail.sender)}
                          </span>
                        </div>
                        <div className="flex-grow flex items-center overflow-hidden">
                          <span className="font-medium truncate min-w-[175px] max-w-[400px] mr-2">
                            {thread.subject}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end flex-shrink-0 w-40 p-4">
                        <span className="text-sm text-gray-500">
                          {new Date(thread.lastActivityDate!).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </Panel>

      {selectedThread && (
        <>
          <PanelResizeHandle className="w-1 hover:bg-gray-200 transition-colors" />
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full overflow-auto">
              <ThreadDetails thread={selectedThread} />
            </div>
          </Panel>
        </>
      )}
    </PanelGroup>
  );
}

// Optional: Style the resize handle
const ResizeHandle = ({ className }: { className?: string }) => (
  <div className={`${className} cursor-col-resize flex items-center justify-center`}>
    <div className="w-[1px] h-full bg-gray-200" />
  </div>
);
