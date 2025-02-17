'use client';

import { useEffect, useRef, useState } from 'react';
import { useIntersection } from '@mantine/hooks';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClientWrapper } from '@/app/components/client-wrapper';

interface Email {
  id: number;
  subject: string;
  body: string;
  fromEmail: string;
  toEmail: string;
  receivedAt: string;
  read: boolean;
}

function InboxContent() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<number | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const searchParams = useSearchParams();

  const lastEmailRef = useRef<HTMLDivElement>(null);
  const { ref, entry } = useIntersection({
    root: lastEmailRef.current,
    threshold: 1,
  });

  useEffect(() => {
    fetchEmails();
  }, [searchParams]);

  useEffect(() => {
    if (entry?.isIntersecting && hasMore) {
      fetchEmails(cursor);
    }
  }, [entry]);

  async function fetchEmails(cursor?: number) {
    try {
      setLoading(true);
      const q = searchParams.get('q');
      const url = `/api/emails?${q ? `q=${q}&` : ''}${
        cursor ? `cursor=${cursor}` : ''
      }`;
      const res = await fetch(url);
      const data = await res.json();

      if (cursor) {
        setEmails((prev) => [...prev, ...data.emails]);
      } else {
        setEmails(data.emails);
      }

      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: number) {
    try {
      await fetch('/api/emails', {
        method: 'PATCH',
        body: JSON.stringify({ id, read: true }),
      });
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Email List */}
      <div className="w-1/3 border-r border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold">Inbox</h1>
        </div>
        <div className="flex-1 overflow-auto" data-testid="email-list">
          <div className="divide-y divide-gray-200">
            {emails?.map((email, i) => (
              <div
                key={email.id}
                ref={i === emails.length - 1 ? ref : undefined}
                data-testid="email-item"
                className={`px-4 py-2 cursor-pointer hover:bg-gray-50 relative ${
                  selectedEmail?.id === email.id ? 'bg-gray-50' : ''
                } ${!email.read ? 'font-semibold' : ''}`}
                onClick={() => {
                  setSelectedEmail(email);
                  if (!email.read) markAsRead(email.id);
                }}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm" data-testid="email-sender">{email.fromEmail}</span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(email.receivedAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                <div className="text-sm font-medium mb-1" data-testid="email-subject">{email.subject}</div>
                <div className="text-sm text-gray-500 truncate">{email.body}</div>
                {!email.read && <div data-testid="unread-indicator" className="w-2 h-2 rounded-full bg-blue-500 absolute top-2 right-2" />}
              </div>
            ))}
            {loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
              {!loading && emails.length === 0 && (
                <div className="flex-1 flex items-center mt-10 justify-center text-gray-500">
                  No emails found
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Email Details */}
      <div className="flex-1 overflow-hidden flex flex-col" data-testid="email-detail">
        {selectedEmail ? (
          <>
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-semibold mb-4" data-testid="email-detail-subject">{selectedEmail.subject}</h1>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div>
                  <div>From: {selectedEmail.fromEmail}</div>
                  <div>To: {selectedEmail.toEmail}</div>
                </div>
                <div>
                  {format(new Date(selectedEmail.receivedAt), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-3xl">
                <div className="prose" data-testid="email-detail-content">{selectedEmail.body}</div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select an email to view its contents
          </div>
        )}
      </div>
    </div>
  );
}

export default function InboxPage() {
  return (
    <ClientWrapper>
      <InboxContent />
    </ClientWrapper>
  );
} 