'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ClientWrapper } from '@/app/components/client-wrapper';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";

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

function ProcessedEmailsContent() {
  const searchParams = useSearchParams();
  const [emails, setEmails] = useState<ProcessedEmail[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<ProcessedEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [ruleGroups, setRuleGroups] = useState<Record<string, ProcessedEmail[]>>({});
  const [openRules, setOpenRules] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchProcessedEmails();
  }, [searchParams]);

  async function fetchProcessedEmails() {
    try {
      setLoading(true);
      const q = searchParams.get('q');
      const res = await fetch(`/api/processed-emails${q ? `?q=${q}` : ''}`);
      const data = await res.json();
      
      // Group emails by rule
      const groups = data.emails.reduce((acc: Record<string, ProcessedEmail[]>, email: ProcessedEmail) => {
        const ruleName = email.ruleName || 'Uncategorized';
        acc[ruleName] = acc[ruleName] || [];
        acc[ruleName].push(email);
        return acc;
      }, {});
      
      setRuleGroups(groups);
      setEmails(data.emails);
    } catch (error) {
      console.error('Error fetching processed emails:', error);
      setRuleGroups({});
    } finally {
      setLoading(false);
    }
  }

  const toggleRule = (ruleName: string) => {
    setOpenRules(prev => ({
      ...prev,
      [ruleName]: !prev[ruleName]
    }));
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Column - Email List */}
      <div className="w-1/3 border-r border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold">Processed Emails</h1>
        </div>
        <ScrollArea className="flex-1">
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="text-gray-500">Loading...</div>
              </div>
            ) : (
              Object.entries(ruleGroups).map(([ruleName, ruleEmails]) => (
                <Collapsible
                  key={ruleName}
                  open={openRules[ruleName]}
                  onOpenChange={() => toggleRule(ruleName)}
                  className="p-2"
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <ChevronRight 
                        className={`h-4 w-4 transition-transform ${
                          openRules[ruleName] ? 'transform rotate-90' : ''
                        }`}
                      />
                      <span className="text-sm font-medium">{ruleName}</span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {ruleEmails.length}
                    </span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-1 mt-1 ml-6">
                      {ruleEmails.map((email) => (
                        <div
                          key={email.id}
                          onClick={() => setSelectedEmail(email)}
                          className={`p-2 rounded cursor-pointer hover:bg-gray-50 ${
                            selectedEmail?.id === email.id ? 'bg-gray-50' : ''
                          }`}
                        >
                          <div className="text-sm font-medium">{email.email.subject}</div>
                          <div className="text-xs text-gray-500 flex justify-between items-center">
                            <span>{email.email.fromEmail}</span>
                            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                              email.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {email.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Column - Email Details */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {selectedEmail ? (
          <>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-semibold mb-4">{selectedEmail.email.subject}</h2>
              <div className="flex justify-between items-start text-sm text-gray-500">
                <div>
                  <div>From: {selectedEmail.email.fromEmail}</div>
                  <div>To: {selectedEmail.email.toEmail}</div>
                  <div className="mt-2">
                    <span className="text-blue-600">Rule: {selectedEmail.ruleName}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div>{format(new Date(selectedEmail.email.sentDate), 'MMM d, yyyy h:mm a')}</div>
                  <div className="mt-1">
                    Processed: {format(new Date(selectedEmail.processedAt), 'MMM d, h:mm a')}
                  </div>
                  <span className={`mt-2 inline-block px-2 py-1 rounded-full text-xs ${
                    selectedEmail.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedEmail.status}
                  </span>
                </div>
              </div>
            </div>
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-3xl">
                <div className="prose">{selectedEmail.email.body}</div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select an email to view its details
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProcessedEmailsPage() {
  return (
    <ClientWrapper>
      <ProcessedEmailsContent />
    </ClientWrapper>
  );
} 