'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JsonTreeView } from './JsonTreeView';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { ScrollArea } from "@/components/ui/scroll-area"

interface EmailComposerProps {
  templateType: 'mjml' | 'html';
  initialTemplate: string;
  emailData: any;
  onSave: (template: string) => void;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  templateType,
  initialTemplate,
  emailData,
  onSave,
}) => {
  const [template, setTemplate] = useState(initialTemplate);
  const [preview, setPreview] = useState<string>('');
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

  // Mark preview as needing update when template changes
  useEffect(() => {
    setPreviewNeedsUpdate(true);
  }, [template]);

  // Only render preview when switching to preview tab
  useEffect(() => {
    if (activeTab === 'preview' && previewNeedsUpdate) {
      renderPreview();
    }
  }, [activeTab]);

  const renderPreview = async () => {
    if (!template) return;
    
    setIsRendering(true);
    try {
      const response = await fetch('/api/render-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template,
          templateType,
          data: {email:emailData},
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
    <div className="flex flex-col h-full">
      <div className="flex-1 flex min-h-0 overflow-hidden">
        <div className="w-1/3 border-r">
          <ScrollArea className="h-full p-4">
            <JsonTreeView data={emailData} onDragStart={handleJsonDragStart} />
          </ScrollArea>
        </div>
        
        <div className="w-2/3 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col min-h-0">
            <TabsList className="mx-4 mt-2 flex-shrink-0">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="px-4 h-full" ref={editorRef}>
                  <CodeEditor
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
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  />
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="preview" className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {isRendering ? (
                  <div className="flex items-center justify-center h-full p-4">
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <div className="p-4 border-t flex justify-end space-x-2 bg-white">
        <Button variant="outline" onClick={() => onSave(template)}>
          Save Template
        </Button>
      </div>
    </div>
  );
};