'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClientWrapper } from '@/app/components/client-wrapper';

interface ProcessedEmail {
  id: number;
  emailId: number;
  ruleName: string;
  status: string;
  processedAt: string;
  email: {
    subject: string;
    body: string;
    fromEmail: string;
    toEmail: string;
    sentDate: string;
  };
}

function ProcessedEmailList() {
  const [processedEmails, setProcessedEmails] = useState<ProcessedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<ProcessedEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchProcessedEmails();
  }, [searchParams]);

  async function fetchProcessedEmails() {
    try {
      setLoading(true);
      const res = await fetch('/api/processed-emails');
      const data = await res.json();
      setProcessedEmails(data.emails);
    } catch (error) {
      console.error('Error fetching processed emails:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleRule = (ruleName: string) => {
    setExpandedRules(prev => {
      const next = new Set(prev);
      if (next.has(ruleName)) {
        next.delete(ruleName);
      } else {
        next.add(ruleName);
      }
      return next;
    });
  };

  // Group emails by rule
  const emailsByRule = processedEmails?.reduce((acc, email) => {
    if (!acc[email.ruleName]) {
      acc[email.ruleName] = [];
    }
    acc[email.ruleName].push(email);
    return acc;
  }, {} as Record<string, ProcessedEmail[]>);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Rules List */}
      <div className="w-1/3 border-r border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold">Processed Emails</h1>
        </div>
        <div className="flex-1 overflow-auto" data-testid="rules-list">
          {Object.entries(emailsByRule || {}).map(([ruleName, emails]) => (
            <div key={ruleName} data-testid="rule-item">
              <div
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleRule(ruleName)}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{ruleName}</span>
                  <span className="text-sm text-gray-500">
                    {emails.length} emails
                  </span>
                </div>
              </div>
              {expandedRules.has(ruleName) && (
                <div className="pl-4" data-testid="processed-emails">
                  {emails.map((email) => (
                    <div
                      key={email.id}
                      data-testid="email-item"
                      className={`p-4 cursor-pointer hover:bg-gray-50 ${
                        selectedEmail?.id === email.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedEmail(email)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-sm">{email.email.fromEmail}</span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(email.processedAt), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <div className="text-sm font-medium mb-1">
                        {email.email.subject}
                      </div>
                      <div className="text-xs text-gray-500">
                        Status: {email.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="p-4 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          )}
          {!loading && processedEmails?.length === 0 && (
            <div className="p-4 text-gray-500 text-center">
              No processed emails found
            </div>
          )}
        </div>
      </div>

      {/* Email Details */}
      <div className="flex-1 overflow-hidden flex flex-col" data-testid="email-detail">
        {selectedEmail ? (
          <>
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-semibold mb-4" data-testid="email-detail-subject">
                {selectedEmail.email.subject}
              </h1>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <div>
                  <div>From: {selectedEmail.email.fromEmail}</div>
                  <div>To: {selectedEmail.email.toEmail}</div>
                </div>
                <div>
                  {format(
                    new Date(selectedEmail.email.sentDate),
                    'MMM d, yyyy h:mm a'
                  )}
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-3xl">
                <div className="prose" data-testid="email-detail-content">
                  {selectedEmail.email.body}
                </div>
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-medium mb-4">Processing Details</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium">Rule:</span> {selectedEmail.ruleName}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>{' '}
                      <span
                        className={`${
                          selectedEmail.status === 'success'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {selectedEmail.status}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Processed At:</span>{' '}
                      {format(
                        new Date(selectedEmail.processedAt),
                        'MMM d, yyyy h:mm:ss a'
                      )}
                    </div>
                  </div>
                </div>
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

export default function ProcessedEmailsPage() {
  return (
    <ClientWrapper>
      <ProcessedEmailList />
    </ClientWrapper>
  );
} 