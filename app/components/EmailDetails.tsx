import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Paperclip } from 'lucide-react';
import DOMPurify from 'isomorphic-dompurify';
import { useSelection } from '../context/SelectionContext';
import type { Email } from '@/types/common';

export const EmailDetails = () => {
  const { selectedItem: selectedEmail } = useSelection<Email>();

  if (!selectedEmail) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select an email to view its contents
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold mb-4" data-testid="email-detail-subject">
          {selectedEmail.subject}
        </h1>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div>
            <div>From: {selectedEmail.fromEmail}</div>
            <div>To: {selectedEmail.toEmail}</div>
          </div>
          <div>
            {selectedEmail.sentDate ? format(new Date(selectedEmail.sentDate), 'MMM d, yyyy h:mm a') : ''}
          </div>
        </div>
      </div>
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-3xl">
          <div 
            className="prose prose-sm max-w-none" 
            data-testid="email-detail-content"
            {...(selectedEmail.isHtml 
              ? { 
                  dangerouslySetInnerHTML: { 
                    __html: DOMPurify.sanitize(selectedEmail.body) 
                  } 
                }
              : { children: selectedEmail.body }
            )}
          />
          {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold">Attachments ({selectedEmail.attachments.length})</h2>
              <ul className="list-disc list-inside">
                {selectedEmail.attachments.map((attachment, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Paperclip className="h-4 w-4 text-gray-500" />
                    <a
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = `/api/attachments/${attachment.id}`;
                        link.download = attachment.fileName;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="text-blue-500 hover:underline cursor-pointer"
                    >
                      {String(attachment.fileName)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}; 