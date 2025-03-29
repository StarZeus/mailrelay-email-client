'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { parseEmail } from '@/lib/utils/string';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import DOMPurify from 'isomorphic-dompurify';
import { Email, ProcessedEmail } from '@/types/common';
import { useSelection } from '../context/SelectionContext';
import { useBasePath } from './providers/basepath-provider';




export function ProcessedEmailList() {
    const basePath = useBasePath();
    const [processedEmails, setProcessedEmails] = useState<Email[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const searchParams = useSearchParams();
    const { selectedItem: selectedEmail, setSelectedItem: setSelectedEmail } = useSelection<ProcessedEmail>();
  
    useEffect(() => {
      fetchProcessedEmails();
    }, [searchParams]);
  
    async function fetchProcessedEmails() {
      try {
        setLoading(true);
        const res = await fetch(`${basePath}/api/processed-emails`);
        const data = await res.json();
        // Add HTML detection
        const processedData = data.emails.map((email: ProcessedEmail) => ({
          ...email,
          email: {
            ...email.email,
            isHtml: email.email.body?.toLowerCase().includes('<!doctype html') ||
                    email.email.body?.toLowerCase().includes('<html') ||
                    (email.email.body?.includes('<') && email.email.body?.includes('>') &&
                     (email.email.body?.includes('<div') || email.email.body?.includes('<p') ||
                      email.email.body?.includes('<table') || email.email.body?.includes('<a')))
          }
        }));
        setProcessedEmails(processedData);
      } catch (error) {
        console.error('Error fetching processed emails:', error);
        toast.error('Failed to fetch processed emails');
      } finally {
        setLoading(false);
      }
    }
  
    const refreshEmails = async () => {
      setIsRefreshing(true);
      await fetchProcessedEmails();
      setIsRefreshing(false);
    };
  
    const deleteAllProcessed = async () => {
      try {
        const res = await fetch(`${basePath}/processed-emails`, {
          method: 'DELETE'
        });
        
        if (!res.ok) throw new Error('Failed to delete processed emails');
        
        setProcessedEmails([]);
        setSelectedEmail(null);
        toast.success('All processed emails deleted');
        setShowDeleteDialog(false);
      } catch (error) {
        console.error('Error deleting processed emails:', error);
        toast.error('Failed to delete processed emails');
      }
    };
  
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
      <>
          <div className="border-r border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold">Processed Emails</h1>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={refreshEmails}
                    disabled={isRefreshing}
                    className={isRefreshing ? 'animate-spin' : ''}
                    title="Refresh processed emails"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDeleteDialog(true)}
                    title="Delete all processed emails"
                    disabled={processedEmails.length === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-auto" data-testid="rules-list">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 text-gray-400 animate-spin" />
                </div>
              ) : Object.entries(emailsByRule || {}).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No processed emails found
                </div>
              ) : (
                Object.entries(emailsByRule || {}).map(([ruleName, emails]) => (
                  <div key={ruleName} data-testid="rule-item">
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 flex items-center"
                      onClick={() => toggleRule(ruleName)}
                    >
                      {expandedRules.has(ruleName) ? (
                        <ChevronDown className="h-4 w-4 mr-2 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-2 flex-shrink-0" />
                      )}
                      <div className="flex justify-between items-center flex-1">
                        <span className="font-medium">{ruleName}</span>
                        <span className="text-sm text-gray-500">
                          {emails.length} emails
                        </span>
                      </div>
                    </div>
                    {expandedRules.has(ruleName) && (
                      <div className="divide-y divide-gray-200" data-testid="processed-emails">
                        {emails.map((email) => {
                          const { name, email: parsedEmail } = parseEmail(email.email.fromEmail);
                          const formattedDate = format(new Date(email.processedAt), 'MMM dd, h:mm a');
                          
                          return (
                            <div
                              key={email.id}
                              data-testid="email-item"
                              className={`p-3 transition-all duration-200 hover:bg-gray-50 cursor-pointer border-b group ${
                                selectedEmail?.id === email.id ? 'bg-blue-50 border-l-4 border-l-gray-200' : ''
                              }`}
                              onClick={() => setSelectedEmail(email.email)}
                            >
                              <div className="flex items-start">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="truncate text-sm text-gray-900">
                                      {name ? (
                                        <p className="capitalize">{name}</p>
                                      ) : (
                                        <p className="text-sm">{parsedEmail}</p>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-400 whitespace-nowrap">
                                      {formattedDate}
                                    </div>
                                  </div>
  
                                  <div className="mt-0.5 text-sm text-gray-900">
                                    {email.email.subject}
                                  </div>
                                  
                                  <div className="flex items-center gap-2 mt-1">
                                    <div className="text-sm text-gray-500 truncate flex-1">
                                      {DOMPurify.sanitize(email.email.body, { ALLOWED_TAGS: [] }).slice(0, 100)}
                                    </div>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                      email.status === 'success' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {email.status}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
  
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete All Processed Emails</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all processed emails. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={deleteAllProcessed}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                Delete All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  };