'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  mode: 'html' | 'javascript' | 'mjml';
  placeholder?: string;
  height?: string;
  className?: string;
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  readOnly?: boolean;
}

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '14px',
    backgroundColor: 'white',
    borderRight: '1px solid #e2e8f0'
  },
  '.cm-scroller': {
    fontFamily: 'monospace',
    lineHeight: '1.6'
  },
  '.cm-content': {
    padding: '8px 0'
  },
  '.cm-editor': {
    height: '100%',
    overflow: 'auto'
  },
  '.cm-line': {
    padding: '0 4px',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#f1f5f9',
  },
  '.cm-gutters': {
    backgroundColor: '#f8fafc',
    border: 'none',
    borderRight: '1px solid #e2e8f0',
  },
  '.cm-gutterElement': {
    padding: '0 8px 0 4px',
    color: '#64748b',
  },
});

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  mode,
  placeholder,
  className,
  height = '100%', // Changed default from 400px to 100%
  onDrop,
  onDragOver,
  onDragLeave,
  readOnly = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      const resizeObserver = new ResizeObserver(() => {
        if (viewRef.current) {
          viewRef.current.requestMeasure();
        }
      });
      
      resizeObserver.observe(editorRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const getLanguageExtension = useCallback(() => {
    switch (mode) {
      case 'html':
      case 'mjml':
        return html();
      case 'javascript':
        return javascript();
      default:
        return html();
    }
  }, [mode]);

  return (
    <div 
      ref={editorRef}
      className={`relative h-full overflow-auto ${className || ''}`}
      style={{
        position: 'relative'
      }}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <div className="h-full">
        <CodeMirror
          value={value}
          onChange={onChange}
          extensions={[
            getLanguageExtension(),
            editorTheme,
            EditorView.lineWrapping,
            EditorView.scrollMargins.of(() => ({top: 0, bottom: 0})),
            EditorView.updateListener.of(update => {
              if (update.view) {
                viewRef.current = update.view;
              }
            })
          ]}
          placeholder={placeholder}
          className="h-full"
          readOnly={readOnly}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true
          }}
        />
      </div>
    </div>
  );
};