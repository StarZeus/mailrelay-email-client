'use client';

import { Label } from '@/components/ui/label';
import { CodeEditor } from '@/app/components/CodeEditor';
import { SortableActionProps } from '../../types';

type JavaScriptConfigProps = Pick<SortableActionProps, 'action' | 'isEditing' | 'onChange'>;

export const JavaScriptConfig = ({ action, isEditing, onChange }: JavaScriptConfigProps) => {
  return (
    <div>
      <Label>JavaScript Code</Label>
      <div className="grid grid-cols-2 gap-4 mt-2 h-[500px]">
        <div className="border rounded-lg p-4 overflow-auto h-full">
          <div className="font-semibold mb-2">Script Help</div>
          <div className="space-y-4">
            <div>
              <div className="font-semibold mb-2">Available Variables:</div>
              <pre className="text-xs bg-gray-50 p-2 rounded">
              {`
Input Object:
{
  email: {
    id: number            // Unique ID of the email
    fromEmail: string     // Sender's email address
    toEmail: string       // Recipient's email address
    subject: string|null  // Email subject line
    body: string|null     // Email body content
    bodyJson: object|null // Email body content as JSON
    isHtml: boolean       // Whether the email is HTML
    sentDate: Date        // When email was sent
    attachments: {
      fileName: string
      data: [{}]          // Attachment data as JSON array
    }[]
  },
  chainData: any // Chain data from previous actions
}`}
                      </pre>
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Available Functions:</div>
                      <pre className="text-xs bg-gray-50 p-2 rounded">
{`console.log()    // Log info messages
console.error()  // Log error messages
fetch()         // Make HTTP requests
setTimeout()    // Delay execution
clearTimeout()  // Clear a timeout
Promise         // Work with promises`}
                      </pre>
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Example:</div>
                      <pre className="text-xs bg-gray-50 p-2 rounded">
{`// Send email data to external API
const response = await fetch('https://api.example.com', {
  method: 'POST',
  body: JSON.stringify({ emailId: input.email.id })
});

// Process email content
if (input.email.subject.includes('urgent')) {
  console.log('Processing urgent email');
  // Your urgent handling logic
}
return response;  // This will be sent to the next action as chainData
`}
              </pre>
            </div>
          </div>
        </div>
        <div className="border rounded-lg overflow-auto h-full">
          <CodeEditor
            value={action.config.code || ''}
            onChange={(value) => {
              onChange({
                ...action,
                config: {
                  ...action.config,
                  code: value,
                },
              });
            }}
            mode="javascript"
            readOnly={!isEditing}
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}; 