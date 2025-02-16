'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface ProcessedEmail {
  id: number;
  subject: string;
  body: string;
  status: string;
  error?: string;
  processedAt: string;
  fromEmail: string;
}

interface RuleGroup {
  id: number;
  name: string;
  emails: ProcessedEmail[];
}

export default function ProcessedEmailsPage() {
  const [ruleGroups, setRuleGroups] = useState<RuleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<ProcessedEmail | null>(null);

  useEffect(() => {
    fetchProcessedEmails();
  }, []);

  async function fetchProcessedEmails() {
    try {
      setLoading(true);
      const res = await fetch('/api/processed-emails');
      const data = await res.json();
      setRuleGroups(data);
    } catch (error) {
      console.error('Error fetching processed emails:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Rules and Emails List */}
      <div className="w-1/3 border-r border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Processed Emails</h2>
        </div>
        <ScrollArea className="flex-1">
          <Accordion type="single" collapsible className="w-full">
            {ruleGroups?.map((group) => (
              <AccordionItem key={group.id} value={group.id.toString()}>
                <AccordionTrigger className="px-4 hover:no-underline hover:bg-gray-50">
                  <div className="flex items-center justify-between w-full pr-4">
                    <span>{group.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      {group.emails.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="divide-y divide-gray-200">
                    {group.emails.map((email) => (
                      <div
                        key={email.id}
                        className={`p-4 cursor-pointer hover:bg-gray-50 ${
                          selectedEmail?.id === email.id ? 'bg-gray-50' : ''
                        }`}
                        onClick={() => setSelectedEmail(email)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-sm">{email.fromEmail}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(email.processedAt), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <div className="text-sm font-medium mb-1 flex items-center">
                          {email.status === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                          )}
                          {email.subject}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
            {ruleGroups.length === 0 && (
              <div className="flex-1 flex mt-10 items-center justify-center text-gray-500">
                No processed emails found
              </div>
            )}
          </Accordion>
        </ScrollArea>
      </div>

      {/* Email Details */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {selectedEmail ? (
          <>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center mb-4">
                <h1 className="text-2xl font-semibold">{selectedEmail.subject}</h1>
                <Badge
                  variant={selectedEmail.status === 'success' ? 'default' : 'destructive'}
                  className="ml-4"
                >
                  {selectedEmail.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500 mb-6">
                <div>
                  <div>From: {selectedEmail.fromEmail}</div>
                  <div>Processed: {format(new Date(selectedEmail.processedAt), 'MMM d, yyyy h:mm a')}</div>
                </div>
              </div>
              {selectedEmail.error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
                  <div className="font-medium">Error:</div>
                  <div>{selectedEmail.error}</div>
                </div>
              )}
            </div>
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-3xl">
                <div className="prose">{selectedEmail.body}</div>
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