'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JsonTreeView } from './JsonTreeView';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { CodeEditor } from './CodeEditor';

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

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      renderPreview();
    }, 500); // 500ms delay

    return () => clearTimeout(debounceTimer);
  }, [template]);

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
      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/3 border-r overflow-auto p-4">
          <JsonTreeView data={emailData} onDragStart={handleJsonDragStart} />
        </div>
        
        <div className="w-2/3 flex flex-col">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-4">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="flex-1 p-4 overflow-auto">
              <div ref={editorRef}>
                <CodeEditor
                  value={template}
                  onChange={setTemplate}
                  mode={templateType}
                  height="calc(100vh - 250px)"
                  placeholder={templateType === 'mjml' ? 
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
            </TabsContent>
            
            <TabsContent value="preview" className="flex-1 p-4 overflow-auto">
              {isRendering ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div 
                  className="border rounded-lg p-4 h-full overflow-auto bg-white"
                  dangerouslySetInnerHTML={{ __html: preview }}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <div className="p-4 border-t flex justify-end space-x-2">
        <Button variant="outline" onClick={() => onSave(template)}>
          Save Template
        </Button>
      </div>
    </div>
  );
}; 