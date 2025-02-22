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
          className={`p-4 border rounded-lg ${email.read ? 'bg-gray-50' : 'bg-white'}`}
          onClick={() => markAsRead(email.id)}
        >
          <h3 className="font-semibold">{email.subject}</h3>
          <p className="text-sm text-gray-600">{email.fromEmail}</p>
          <p className="text-xs text-gray-400">{new Date(email.sentDate).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}; 