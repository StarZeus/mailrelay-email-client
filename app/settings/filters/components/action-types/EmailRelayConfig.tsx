'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CodeEditor } from '@/app/components/CodeEditor';
import { Maximize2 } from 'lucide-react';
import { toast } from 'sonner';
import { SortableActionProps } from '../../types';

type EmailRelayConfigProps = Pick<SortableActionProps, 'action' | 'isEditing' | 'onChange'> & {
  onOpenComposer?: (index: number) => void;
  index?: number;
};

export const EmailRelayConfig = ({ action, isEditing, onChange, onOpenComposer, index }: EmailRelayConfigProps) => {
  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget;
    target.classList.remove('bg-blue-50', 'border-blue-300');

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];
    
    if (!file) return;

    // Validate file type
    const isHTML = file.name.endsWith('.html') || file.name.endsWith('.htm');
    const isMJML = file.name.endsWith('.mjml');
    
    if (!isHTML && !isMJML) {
      toast.error('Please drop a valid template file (.html, .htm, or .mjml)');
      return;
    }

    // Check if file type matches selected template type
    if ((isHTML && action.config.templateType === 'mjml') || 
        (isMJML && action.config.templateType === 'html')) {
      toast.error(`Please drop a ${action.config.templateType.toUpperCase()} file`);
      return;
    }

    try {
      const content = await file.text();
      onChange({
        ...action,
        config: {
          ...action.config,
          [action.config.templateType === 'mjml' ? 'mjmlTemplate' : 'htmlTemplate']: content,
        },
      });
      toast.success('Template loaded successfully');
    } catch (error) {
      toast.error('Failed to load template file');
      console.error('Error loading template:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Template Type</Label>
        <Select
          value={action.config.templateType || 'html'}
          onValueChange={(value) => {
            onChange({
              ...action,
              config: {
                ...action.config,
                templateType: value,
              },
            });
          }}
          disabled={!isEditing}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="html">HTML Template</SelectItem>
            <SelectItem value="mjml">MJML Template</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label>{action.config.templateType === 'mjml' ? 'MJML Template' : 'HTML Template'}</Label>
          {onOpenComposer && index !== undefined && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Open in composer"
              onClick={() => onOpenComposer(index)}
              disabled={!isEditing}
            >
              <Maximize2 className="h-5 w-5" />
              <span className="sr-only">Open in composer</span>
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <div className="font-semibold mb-2">Available Email Data:</div>
            <div className="space-y-2 text-sm">
              {[
                { key: 'email.subject', value: '{{email.subject}}' },
                { key: 'email.fromEmail', value: '{{email.fromEmail}}' },
                { key: 'email.toEmail', value: '{{email.toEmail}}' },
                { key: 'email.body', value: '{{{email.body}}}', note: '(unescaped HTML)' },
                { key: 'email.bodyJson', value: '{{email.bodyJson}}', note: '(email body as JSON)' }
              ].map((item) => (
                <div
                  key={item.key}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', item.value);
                  }}
                  className="p-2 bg-gray-50 rounded cursor-move hover:bg-gray-100 flex items-center"
                >
                  <span className="mr-2">⋮⋮</span>
                  <span>{item.key}</span>
                  {item.note && <span className="ml-2 text-gray-500 text-xs">{item.note}</span>}
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-gray-500">
              Drag variables into your template to insert dynamic content
            </div>
            {action.config.templateType === 'mjml' && (
              <div className="mt-4 p-2 bg-blue-50 rounded text-xs">
                <div className="font-semibold">MJML Tips:</div>
                <ul className="list-disc list-inside mt-1">
                  <li>Use {'<mj-text>'} for text content</li>
                  <li>Use {'<mj-image>'} for images</li>
                  <li>Use {'<mj-divider>'} for horizontal lines</li>
                  <li>Use {'<mj-button>'} for buttons</li>
                </ul>
              </div>
            )}
          </div>
          <div 
            className="relative border-2 border-gray-100 rounded-lg"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const target = e.currentTarget;
              target.classList.add('bg-blue-50', 'border-blue-300');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const target = e.currentTarget;
              target.classList.remove('bg-blue-50', 'border-blue-300');
            }}
            onDrop={handleFileDrop}
          >
            <CodeEditor
              value={action.config.templateType === 'mjml' ? (action.config.mjmlTemplate || '') : (action.config.htmlTemplate || '')}
              onChange={(value) => {
                onChange({
                  ...action,
                  config: {
                    ...action.config,
                    [action.config.templateType === 'mjml' ? 'mjmlTemplate' : 'htmlTemplate']: value,
                  },
                });
              }}
              mode={action.config.templateType}
              readOnly={!isEditing}
              height="400px"
              placeholder={action.config.templateType === 'mjml' ? 
                `<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>{{email.subject}}</mj-text>
        <mj-divider />
        <mj-text>{{{email.body}}}</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>` : 
                `<!DOCTYPE html><html><head><title>{{email.subject}}</title></head><body>...</body></html>`
              }
            />
            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-transparent transition-colors duration-200">
              <div className="absolute inset-0 flex items-center justify-center opacity-0 bg-blue-50/50 transition-opacity duration-200">
                <p className="text-blue-600 text-center">
                  Drop your {action.config.templateType === 'mjml' ? 'MJML' : 'HTML'} template file here
                </p>
              </div>
            </div>
          </div>          
        </div>
      </div>
      <div>
        <Label>Recipient Expression</Label>
        <Input
          value={action.config.recipientExpression || ''}
          onChange={(e) => {
            onChange({
              ...action,
              config: {
                ...action.config,
                recipientExpression: e.target.value,
              },
            });
          }}
          disabled={!isEditing}
          placeholder="email.toEmail or custom expression to extract recipients"
        />
      </div>
    </div>
  );
}; 