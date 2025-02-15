'use client';

import { ThreadActions } from './thread-actions';

interface Email {
  id: number;
  body: string;
  sentDate: Date;
  sender: {
    firstName: string;
    lastName: string;
  };
}

interface ThreadDetailsProps {
  thread: {
    id: number;
    subject: string;
    emails: Email[];
  };
}

export function ThreadDetails({ thread }: ThreadDetailsProps) {
  return (
    <div className="h-full border-l border-gray-200 overflow-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">{thread.subject}</h1>
          <ThreadActions threadId={thread.id} />
        </div>
        <div className="space-y-6">
          {thread.emails.map((email) => (
            <div key={email.id} className="bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="font-semibold">
                  {email.sender.firstName} {email.sender.lastName}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(email.sentDate).toLocaleString()}
                </div>
              </div>
              <div className="p-4 whitespace-pre-wrap">
                {email.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 