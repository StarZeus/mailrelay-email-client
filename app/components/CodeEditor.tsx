'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView, ViewPlugin } from '@codemirror/view';

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
    display: 'flex',
    flexDirection: 'column'
  },
  '.cm-scroller': {
    fontFamily: 'monospace',
    lineHeight: '1.6',
    height: '100%',
    flex: '1 1 auto',
    overflow: 'auto'
  },
  '&.cm-editor.cm-focused': {
    outline: 'none',
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
  '.cm-content': {
    padding: '8px 0',
    minHeight: '100%'
  },
  '.cm-editor': {
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
});

const heightPlugin = ViewPlugin.fromClass(class {
  update(update: any) {
    if (update.view.dom.parentElement) {
      update.view.dom.parentElement.style.height = '100%';
    }
  }
});

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  mode,
  placeholder,
  className,
  height = '400px',
  onDrop,
  onDragOver,
  onDragLeave,
  readOnly = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    if (onDrop) {
      onDrop(e);
    }
  }, [onDrop]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (onDragOver) {
      onDragOver(e);
    }
  }, [onDragOver]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (onDragLeave) {
      onDragLeave(e);
    }
  }, [onDragLeave]);

  const getLanguageExtension = () => {
    switch (mode) {
      case 'javascript':
        return javascript();
      case 'html':
      case 'mjml':
        return html();
      default:
        return html();
    }
  };

  return (
    <div
      ref={editorRef}
      className={`flex h-full ${className || ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <CodeMirror
        value={value}
        className="flex-1 overflow-auto"
        extensions={[getLanguageExtension(), editorTheme, heightPlugin]}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true,
        }}
      />
    </div>
  );
};