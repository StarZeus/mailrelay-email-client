'use client';

import { useEffect, useState } from 'react';
import { clientLogger } from '@/lib/logger';

interface Email {
  id: string;
  subject: string;
  fromEmail: string;
  sentDate: string;
  read: boolean;
}

export const EmailList = () => {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        clientLogger.debug('Fetching emails from API');
        const response = await fetch('/api/emails');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        clientLogger.info('Emails fetched successfully', { count: data.length });
        setEmails(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch emails';
        clientLogger.error('Error fetching emails', { error: errorMessage });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchEmails();
  }, []);

  const markAsRead = async (emailId: string) => {
    try {
      clientLogger.debug('Marking email as read', { emailId });
      const response = await fetch(`/api/emails/${emailId}/read`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      clientLogger.info('Email marked as read', { emailId });
      setEmails(emails.map(email => 
        email.id === emailId ? { ...email, read: true } : email
      ));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to mark email as read';
      clientLogger.error('Error marking email as read', { emailId, error: errorMessage });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="space-y-4">
      {emails.map(email => (
        <div 
          key={email.id}
          className={`p-4 border rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer ${
            email.read 
              ? 'bg-gray-50 border-gray-200' 
              : 'bg-white border-blue-200 shadow-sm'
          }`}
          onClick={() => markAsRead(email.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`font-semibold text-base mb-1 ${
                email.read ? 'text-gray-700' : 'text-gray-900'
              }`}>
                {email.subject}
                {!email.read && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    New
                  </span>
                )}
              </h3>
              <p className={`text-sm ${
                email.read ? 'text-gray-500' : 'text-gray-600'
              }`}>
                {email.fromEmail}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(email.sentDate).toLocaleString()}
              </p>
            </div>
            {!email.read && (
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}; 