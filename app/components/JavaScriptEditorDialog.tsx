'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CodeEditor } from '@/app/components/CodeEditor';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

interface JavaScriptEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialScript: string;
  onSave: (script: string) => void;
}

export const JavaScriptEditorDialog: React.FC<JavaScriptEditorDialogProps> = ({
  open,
  onOpenChange,
  initialScript,
  onSave,
}) => {
  const [currentScript, setCurrentScript] = useState(initialScript);

  const handleSave = () => {
    onSave(currentScript);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] max-h-[90vh] h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>JavaScript Editor</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
            <ResizablePanel defaultSize={25} minSize={20}>
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Available Variables:</h3>
                    {[
                      { key: 'email.subject', desc: 'Email subject line' },
                      { key: 'email.fromEmail', desc: 'Sender email address' },
                      { key: 'email.toEmail', desc: 'Recipient email address' },
                      { key: 'email.body', desc: 'Email body (HTML)' },
                      { key: 'email.bodyJson', desc: 'Email body as JSON' }
                    ].map((item) => (
                      <div
                        key={item.key}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', item.key);
                        }}
                        className="p-2 bg-gray-50 rounded cursor-move hover:bg-gray-100"
                      >
                        <div className="font-mono text-sm">{item.key}</div>
                        <div className="text-xs text-gray-500">{item.desc}</div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold">Common Functions:</h3>
                    {[
                      { 
                        key: 'parseJson(str)',
                        desc: 'Parse JSON string to object',
                        example: 'const data = parseJson(email.bodyJson);'
                      },
                      { 
                        key: 'stringify(obj)',
                        desc: 'Convert object to JSON string',
                        example: 'const str = stringify({ key: "value" });'
                      },
                      {
                        key: 'fetch(url, options)',
                        desc: 'Make HTTP requests',
                        example: 'const response = await fetch("https://api.example.com");'
                      }
                    ].map((item) => (
                      <div key={item.key} className="p-2 bg-gray-50 rounded">
                        <div className="font-mono text-sm">{item.key}</div>
                        <div className="text-xs text-gray-500">{item.desc}</div>
                        <div className="mt-1 p-1 bg-gray-100 rounded text-xs font-mono">
                          {item.example}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Tips:</h3>
                    <ul className="text-sm space-y-1 list-disc list-inside text-gray-600">
                      <li>Use async/await for asynchronous operations</li>
                      <li>Return values will be passed to the next action</li>
                      <li>Handle errors with try/catch blocks</li>
                      <li>Log with console.log() for debugging</li>
                    </ul>
                  </div>
                </div>
              </ScrollArea>
            </ResizablePanel>
            
            <ResizableHandle withHandle/>
            
            <ResizablePanel defaultSize={75}>
              <div className="h-full">
                <CodeEditor
                  value={currentScript}
                  onChange={(value) => setCurrentScript(value)}
                  mode="javascript"
                  height="calc(100% - 4px)"
                  placeholder={`// Example script
async function processEmail() {
  try {
    const subject = $input.email.subject;
    const body = $input.email.body;
    
    // Your code here
    
    return $input; //Return $input to pass on to next action
  } catch (error) {
    console.error('Error processing email:', error);
    throw error;
  }
}`}
                />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Script
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 