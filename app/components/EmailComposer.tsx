'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JsonTreeView } from './JsonTreeView';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Handlebars } from '@/lib/handlebars-config';
import { Input } from '@/components/ui/input';
import { ResizablePanelGroup } from '@/components/ui/resizable';
import { ResizablePanel } from '@/components/ui/resizable';
import { ResizableHandle } from '@/components/ui/resizable';

interface EmailComposerProps {
  templateType: 'mjml' | 'html';
  initialTemplate: string;
  initialRecipientExpression?: string;
  initialSubjectExpression?: string;
  emailData: any;
  onSave: (template: string, recipientExpression: string, subjectExpression: string) => void;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  templateType,
  initialTemplate,
  initialRecipientExpression = '{{email.toEmail}}',
  initialSubjectExpression = '{{email.subject}}',
  emailData,
  onSave,
}) => {
  const [template, setTemplate] = useState(initialTemplate);
  const [recipientExpression, setRecipientExpression] = useState(initialRecipientExpression);
  const [subjectExpression, setSubjectExpression] = useState(initialSubjectExpression);
  const [preview, setPreview] = useState<string>('');
  const [evaluatedRecipients, setEvaluatedRecipients] = useState<string[]>([]);
  const [evaluatedSubject, setEvaluatedSubject] = useState<string>('');
  const [isRendering, setIsRendering] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<string>('editor');
  const [previewNeedsUpdate, setPreviewNeedsUpdate] = useState(true);
  const editorScrollRef = useRef<{ top: number }>({ top: 0 });

  // Store scroll position when switching tabs
  const handleTabChange = (value: string) => {
    if (activeTab === 'editor' && editorRef.current) {
      editorScrollRef.current.top = editorRef.current.scrollTop;
    }
    setActiveTab(value);
  };

  // Restore scroll position when editor tab is active
  useEffect(() => {
    if (activeTab === 'editor' && editorRef.current) {
      editorRef.current.scrollTop = editorScrollRef.current.top;
    }
  }, [activeTab]);

  // Mark preview as needing update when template, recipient, or subject expression changes
  useEffect(() => {
    setPreviewNeedsUpdate(true);
  }, [template, recipientExpression, subjectExpression]);

  // Only render preview when switching to preview tab
  useEffect(() => {
    if (activeTab === 'preview' && previewNeedsUpdate) {
      renderPreview();
    }
  }, [activeTab]);

  const evaluateRecipients = () => {
    try {
      // If it's the default expression, check if toEmail exists and is not empty
      if (recipientExpression === 'email.toEmail') {
        if (emailData?.toEmail) {
          setEvaluatedRecipients([emailData.toEmail]);
        }
        return;
      }

      // Handle Handlebars-style expressions
      const template = Handlebars.compile(recipientExpression);
      const result = template({ email: emailData });

      let recipients: string[];
      if (typeof result === 'string') {
        if (result.includes(',')) {
          recipients = result.split(',').map((email: string) => email.trim());
        } else {
          recipients = [result];
        }
      } else if (Array.isArray(result)) {
        // Cast the array to unknown first, then filter it
        recipients = (result as unknown[]).filter((r): r is string => typeof r === 'string');
      } else {
        throw new Error('Recipient expression must evaluate to string or array of strings');
      }

      // Basic email validation
      recipients = recipients.filter(email => 
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      );

      if (recipients.length === 0) {
        throw new Error('No valid email addresses found');
      }

      setEvaluatedRecipients(recipients);
    } catch (error) {
      console.error('Error evaluating recipient expression:', error);
      toast.error('Failed to evaluate recipient expression');
      setEvaluatedRecipients([]);
    }
  };

  const evaluateSubject = () => {
    try {
      // If it's the default expression, check if subject exists
      if (subjectExpression === '{{email.subject}}') {
        if (emailData?.subject) {
          setEvaluatedSubject(emailData.subject);
        }
        return;
      }

      // Handle Handlebars-style expressions
      const template = Handlebars.compile(subjectExpression);
      const result = template({ email: emailData });

      if (typeof result !== 'string') {
        throw new Error('Subject expression must evaluate to a string');
      }

      setEvaluatedSubject(result);
    } catch (error) {
      console.error('Error evaluating subject expression:', error);
      toast.error('Failed to evaluate subject expression');
      setEvaluatedSubject('');
    }
  };

  const renderPreview = async () => {
    if (!template) return;
    
    setIsRendering(true);
    try {
      evaluateRecipients();
      evaluateSubject();
      
      const response = await fetch('/api/render-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template,
          templateType,
          data: { 
            email: emailData
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to render template');
      }
      
      const result = await response.json();
      setPreview(result.html);
      setPreviewNeedsUpdate(false);
    } catch (error) {
      console.error('Error rendering template:', error);
      toast.error('Failed to render preview');
    } finally {
      setIsRendering(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editorRef.current) {
      editorRef.current.classList.add('bg-blue-50', 'border-blue-300');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editorRef.current) {
      editorRef.current.classList.remove('bg-blue-50', 'border-blue-300');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (editorRef.current) {
      editorRef.current.classList.remove('bg-blue-50', 'border-blue-300');
      
      const data = e.dataTransfer.getData('text/plain');
      if (!data) return;
      
      // Insert at cursor position
      const editor = editorRef.current.querySelector('.cm-content');
      if (editor) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(data));
        } else {
          setTemplate(prev => prev + data);
        }
      }
    }
  };

  const handleJsonDragStart = (path: string, value: any) => {
    // This is handled by the JsonTreeView component
    console.log(`Dragging ${path} with value:`, value);
  };

  return (
    <div className="grid h-full grid-rows-[1fr_auto]">
        <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-4rem)] rounded-lg border">
          <ResizablePanel defaultSize={35}>
            <div className="flex h-full flex-col overflow-auto">
              <JsonTreeView data={emailData} onDragStart={handleJsonDragStart} />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={65}>
            <div className="flex h-full flex-col overflow-auto">
              <div className="h-full">
                <div className='space-y-2'>
                  <div className='mx-4'>
                    <label className="text-sm font-medium">Recipient Expression</label>
                    <Input
                      type="text"
                      value={recipientExpression}
                      onChange={(e) => setRecipientExpression(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-blue-500"
                      placeholder="{{email.toEmail}} or custom expression to extract recipients"
                    />
                  </div>
                  <div className='mx-4'>
                    <label className="text-sm font-medium">Subject Expression</label>
                    <Input
                      value={subjectExpression}
                      onChange={(e) => setSubjectExpression(e.target.value)}
                      placeholder="{{email.toSubject}} or custom expression"
                      className="mt-1"
                    />

                  </div>
                  <Tabs value={activeTab} onValueChange={handleTabChange} className="flex h-full flex-col">
                    <TabsList className="mx-4 mt-2 sticky top-0 z-10">
                      <TabsTrigger value="editor">Editor</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="editor" className="flex-1 mt-0 overflow-hidden">
                      <div 
                        ref={editorRef} 
                        className="h-full border-t border-b" 
                      >
                        <CodeEditor
                          height='400px'
                          value={template}
                          onChange={setTemplate}
                          mode={templateType}
                          placeholder={templateType === 'mjml' ? 
                            `<mjml>
          <mj-body>
            <mj-section>
              <mj-column>
                <mj-text>{{email.subject}}</mj-text>
                <mj-divider />
                <mj-text>
                  <ul style="list-style-type: disc; padding-left: 20px;">
                    {{#each email.items}}
                      <li style="margin-bottom: 10px;">{{this}}</li>
                    {{/each}}
                  </ul>
                </mj-text>
                <mj-text>{{{email.body}}}</mj-text>
              </mj-column>
            </mj-section>
          </mj-body>
        </mjml>` : 
                            `<!DOCTYPE html>
        <html>
          <head><title>{{email.subject}}</title></head>
          <body>...</body>
        </html>`
                          }
                          className="px-4"
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                        />
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="preview" className="flex-1 mt-0 overflow-hidden h-full flex flex-col">
                      <div className="p-4 border-b">
                        <div className="flex flex-col gap-2">
                          {evaluatedRecipients.length > 0 && (
                            <div className="flex items-start gap-2">
                              <span className="text-sm font-medium text-gray-700">Recipients:</span>
                              <div className="flex-1">
                                {evaluatedRecipients.map((recipient, index) => (
                                  <div key={index} className="text-sm text-gray-600">
                                    {recipient}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <span className="text-sm font-medium text-gray-700">Subject:</span>
                            <div className="flex-1">
                                <div className="text-sm text-gray-600">
                                  {evaluatedSubject}
                                </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full">
                          {isRendering ? (
                            <div className="grid place-items-center h-full p-4">
                              <div className="text-center">
                                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                                <p className="text-gray-500">Rendering preview...</p>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white border rounded-lg m-4">
                              <div className="p-4" dangerouslySetInnerHTML={{ __html: preview }} />
                            </div>
                          )}
                        </ScrollArea>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      
      <div className="p-4 border-t flex items-center justify-end space-x-4 bg-white">
        <Button variant="outline" onClick={() => onSave(template, recipientExpression, subjectExpression)}>
          Save Template
        </Button>
      </div>
    </div>
  );
};