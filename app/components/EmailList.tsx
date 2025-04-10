'use client';

import { useEffect, useRef, useState } from 'react';
import { useIntersection } from '@mantine/hooks';
import { useSearchParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Toggle } from '@/components/ui/toggle';
import { toast } from 'sonner';
import { RefreshCw, Trash2, InboxIcon, CopyPlus } from 'lucide-react';
import { clientLogger } from '@/lib/logger';
import DOMPurify from 'isomorphic-dompurify';
import { parseEmail } from '@/lib/utils/string';
import { useSelection } from '../context/SelectionContext';
import type { Email } from '@/types/common';

export const EmailList = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const { selectedItem: selectedEmail, setSelectedItem: setSelectedEmail } = useSelection<Email>();
  const [selectedEmails, setSelectedEmails] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<number | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUnprocessedOnly, setShowUnprocessedOnly] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();

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
  }, [entry, cursor, hasMore]);

  const fetchEmails = async (cursor?: number) => {
    try {
      clientLogger.debug('Fetching emails from API');
      setLoading(true);
      const q = searchParams.get('q');
      const url = `/api/emails?${q ? `q=${q}&` : ''}${
        cursor ? `cursor=${cursor}&` : ''
      }${showUnprocessedOnly ? 'unprocessed=true&' : ''}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      clientLogger.info('Emails fetched successfully', { count: data.emails.length });
      
      if (cursor) {
        setEmails(prev => [...prev, ...data.emails]);
      } else {
        setEmails(data.emails);
      }

      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch emails';
      clientLogger.error('Error fetching emails', { error: errorMessage });
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  async function markAsRead(id: number) {
    try {
      const response = await fetch('/api/emails', {
        method: 'PATCH',
        body: JSON.stringify({ id, read: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark email as read');
      }

      // Update both the emails list and selected email
      setEmails(prevEmails => 
        prevEmails.map(email => 
          email.id === id ? { ...email, read: true } : email
        )
      );
      
      setSelectedEmail(prevEmail => 
        prevEmail?.id === id ? { ...prevEmail, read: true } : prevEmail
      );
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  }

  const refreshEmails = async () => {
    setIsRefreshing(true);
    setCursor(undefined);
    await fetchEmails();
    setIsRefreshing(false);
  };

  const deleteEmails = async () => {
    if (selectedEmails.size === 0) return;

    try {
      const response = await fetch('/api/emails', {
        method: 'DELETE',
        body: JSON.stringify({ ids: Array.from(selectedEmails) }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete emails');
      }

      setEmails(prevEmails => prevEmails.filter(email => !selectedEmails.has(email.id)));
      setSelectedEmails(new Set());
      setSelectedEmail(null);
      toast.success(`${selectedEmails.size} email(s) deleted`);
    } catch (error) {
      console.error('Error deleting emails:', error);
      toast.error('Failed to delete emails');
    }
  };

  const createFilterFromSelection = () => {
    if (selectedEmails.size === 0) return;
    
    // Get the first selected email to base the filter on
    const selectedEmailIds = Array.from(selectedEmails);
    
    // Construct the query parameters
    const params = new URLSearchParams({
      filterEmail: selectedEmailIds[0].toString()
    });

    // Navigate to filters page with prefilled data
    router.push(`/actions?${params.toString()}`);
  };

  const toggleEmailSelection = (id: number, checked: boolean) => {
    setSelectedEmails(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
      <div className="border-r border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Inbox</h1>
            <div className="flex items-center gap-2">
              <Toggle
                pressed={showUnprocessedOnly}
                onPressedChange={checked => {
                  setShowUnprocessedOnly(checked);
                  setCursor(undefined);
                  setEmails([]);
                  fetchEmails();
                }}
                aria-label="Toggle between all emails and unprocessed emails"
                className="gap-2"
              >
                <InboxIcon className="h-4 w-4" />
                <span className="text-sm">Show All</span>
              </Toggle>
              <Button
                variant="ghost"
                size="icon"
                onClick={refreshEmails}
                disabled={isRefreshing}
                className={isRefreshing ? 'animate-spin' : ''}
                title="Refresh emails"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={deleteEmails}
                disabled={selectedEmails.size === 0}
                title="Delete selected emails"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={createFilterFromSelection}
                disabled={selectedEmails.size === 0}
                title="Create filter from selected email"
              >
                <CopyPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto" data-testid="email-list">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
            </div>
          ) : emails.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No emails found
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {emails.map((email, i) => {
                const { name, email: parsedEmail } = parseEmail(email.fromEmail);
                const formattedDate = email.sentDate ? format(new Date(email.sentDate), 'MMM dd, h:mm a') : '';
                
                return (
                  <div
                    key={email.id}
                    ref={i === emails.length - 1 ? ref : undefined}
                    data-testid="email-item"
                    className={`p-3 transition-all duration-200 hover:bg-gray-50 cursor-pointer border-b group ${
                      selectedEmail?.id === email.id ? 'bg-blue-50 border-l-4 border-l-gray-200' : ''
                    } ${!email.read ? 'font-semibold text-blue-700' : ''}`}
                  >
                    <div className="flex items-start">
                      <div className={`overflow-hidden transition-all duration-200 ${
                        selectedEmails.has(email.id) ? 'w-5' : 'w-0 group-hover:w-5'
                      }`}>
                        <Checkbox
                          checked={selectedEmails.has(email.id)}
                          onCheckedChange={(checked) => toggleEmailSelection(email.id, checked as boolean)}
                          onClick={(e) => e.stopPropagation()}
                          className={`mt-1 ml-0 transition-opacity duration-200 ${
                            selectedEmails.has(email.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        />
                      </div>
                      
                      <div 
                        className="min-w-0 flex-1"
                        onClick={() => {
                          setSelectedEmail(email);
                          if (!email.read) markAsRead(email.id);
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className={`truncate text-sm ${
                            email.read ? 'text-gray-600' : 'text-gray-900 font-medium'
                          }`}>
                            {name ? <p className="capitalize">{name}</p> : <p className="text-sm">{parsedEmail}</p>}
                          </div>
                          <div className="text-xs text-gray-400 whitespace-nowrap">
                            {formattedDate}
                          </div>
                        </div>

                        <div className={`mt-0.5 text-sm ${
                          email.read ? 'text-gray-500' : 'text-gray-900 font-medium'
                        }`}>
                          {email.subject}
                        </div>
                        <div className="text-sm text-gray-500 truncate">
                          {DOMPurify.sanitize(email.body, { ALLOWED_TAGS: [] }).slice(0, 100)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
  );
};