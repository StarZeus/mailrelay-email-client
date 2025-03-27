'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { EditorView } from '@codemirror/view';
import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';

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

const arrayMethodCompletions = [
  { label: 'map', type: 'method', info: 'Creates a new array with the results of calling a function for every array element' },
  { label: 'filter', type: 'method', info: 'Creates a new array with all elements that pass the test implemented by the provided function' },
  { label: 'reduce', type: 'method', info: 'Reduces an array to a single value (from left-to-right)' },
  { label: 'forEach', type: 'method', info: 'Calls a function for each array element' },
  { label: 'find', type: 'method', info: 'Returns the value of the first element in the array that satisfies the provided testing function' },
  { label: 'some', type: 'method', info: 'Tests whether at least one element in the array passes the test implemented by the provided function' },
  { label: 'every', type: 'method', info: 'Tests whether all elements in the array pass the test implemented by the provided function' },
  { label: 'includes', type: 'method', info: 'Determines whether an array includes a certain value' },
  { label: 'indexOf', type: 'method', info: 'Returns the first index at which a given element can be found in the array' },
  { label: 'join', type: 'method', info: 'Joins all elements of an array into a string' },
  { label: 'slice', type: 'method', info: 'Returns a shallow copy of a portion of an array' },
  { label: 'splice', type: 'method', info: 'Changes the contents of an array by removing or replacing existing elements' },
];

const objectMethodCompletions = [
  { label: 'keys', type: 'method', info: 'Returns an array of a given object\'s own enumerable property names' },
  { label: 'values', type: 'method', info: 'Returns an array of a given object\'s own enumerable property values' },
  { label: 'entries', type: 'method', info: 'Returns an array of a given object\'s own enumerable string-keyed property [key, value] pairs' },
  { label: 'hasOwnProperty', type: 'method', info: 'Returns a boolean indicating whether the object has the specified property' },
  { label: 'assign', type: 'method', info: 'Copies all enumerable own properties from one or more source objects to a target object' },
  { label: 'freeze', type: 'method', info: 'Freezes an object: other code can\'t delete or change its properties' },
  { label: 'seal', type: 'method', info: 'Prevents new properties from being added and marks all existing properties as non-configurable' },
];

const inputCompletions = [
  {
    label: '$input',
    type: 'variable',
    detail: 'Input object containing email and chain data',
    info: 'Main input object for JavaScript actions',
    apply: '$input',
  },
  {
    label: '$input.email',
    type: 'property',
    detail: 'Email object containing message details',
    info: 'Contains all email-related properties',
    apply: '$input.email',
  },
  {
    label: '$input.email.id',
    type: 'property',
    detail: 'number',
    info: 'Unique ID of the email',
  },
  {
    label: '$input.email.fromEmail',
    type: 'property',
    detail: 'string',
    info: "Sender's email address",
  },
  {
    label: '$input.email.toEmail',
    type: 'property',
    detail: 'string',
    info: "Recipient's email address",
  },
  {
    label: '$input.email.subject',
    type: 'property',
    detail: 'string | null',
    info: 'Email subject line',
  },
  {
    label: '$input.email.body',
    type: 'property',
    detail: 'string | null',
    info: 'Email body content',
  },
  {
    label: '$input.email.bodyJson',
    type: 'property',
    detail: 'object | null',
    info: 'Email body content as JSON',
  },
  {
    label: '$input.email.isHtml',
    type: 'property',
    detail: 'boolean',
    info: 'Whether the email is HTML',
  },
  {
    label: '$input.email.sentDate',
    type: 'property',
    detail: 'Date',
    info: 'When email was sent',
  },
  {
    label: '$input.email.attachments',
    type: 'property',
    detail: 'Array',
    info: 'Array of email attachments',
  },
  {
    label: '$input.chainData',
    type: 'property',
    detail: 'any',
    info: 'Chain data from previous actions',
  },
];

const createMethodCompletions = (context: CompletionContext): CompletionResult | null => {
  const before = context.matchBefore(/\.[\w]*/);
  if (!before || !before.text.startsWith('.')) return null;

  // Get the node before the dot
  const pos = before.from - 1; // Position right before the dot
  const tree = syntaxTree(context.state);
  const nodeBefore = tree.resolveInner(pos, -1);
  
  // Get the text of the node before the dot
  const nodeText = context.state.sliceDoc(nodeBefore.from, nodeBefore.to);
  
  // Improved detection for arrays
  const isArray = 
    // Known array variable names
    nodeText === 'attachments' || 
    nodeText.endsWith('[]') ||
    // Array-like syntax node types
    nodeBefore.type.name.includes('Array') ||
    // Array literals and expressions
    /\[[^\]]*\]/.test(nodeText) || 
    // Common array method results
    /\.(map|filter|slice|concat)\s*\([^)]*\)$/.test(
      context.state.sliceDoc(Math.max(0, nodeBefore.from - 20), nodeBefore.to)
    ) ||
    // Variables that sound like arrays (plurals)
    /s$/.test(nodeText);

  // Improved detection for objects
  const isObject = 
    // Known object variable names
    ['$input', 'email', 'bodyJson'].some(obj => nodeText.includes(obj)) ||
    // Object-like syntax node types
    nodeBefore.type.name.includes('Object') ||
    // Object literals and expressions
    /\{[^}]*\}/.test(nodeText) ||
    // Any variable name (most variables are objects in JS)
    nodeBefore.type.name === 'VariableName' ||
    // Properties access (obj.prop)
    /\.[\w]+$/.test(nodeText) ||
    // JSON methods and common object creators
    /(JSON\.parse|Object\.create|Object\.assign|new [A-Z][a-zA-Z]*)\s*\([^)]*\)$/.test(
      context.state.sliceDoc(Math.max(0, nodeBefore.from - 30), nodeBefore.to)
    );

  // Get the text after the dot to filter completions
  const searchText = before.text.slice(1).toLowerCase();
  console.log(isArray,searchText);

  if (isArray) {
    return {
      from: before.from,
      options: arrayMethodCompletions.filter(completion => 
        (searchText.length === 0) || completion.label.toLowerCase().startsWith(searchText)
      ),
      validFor: /^\.\w*$/
    };
  }

  if (isObject) {
    return {
      from: before.from,
      options: objectMethodCompletions.filter(completion => 
        completion.label.toLowerCase().startsWith(searchText)
      ),
      validFor: /^\.\w*$/
    };
  }

  return null;
};

const createInputObjectCompletions = (context: CompletionContext): CompletionResult | null => {
  const word = context.matchBefore(/[\w.$]*/);
  if (!word) return null;

  // Get the search text
  const searchText = word.text.toLowerCase();
  
  // Filter completions based on the search text
  const filteredCompletions = inputCompletions.filter(completion => {
    // If user is typing with $ prefix, match exactly
    if (searchText.startsWith('$')) {
      return completion.label.toLowerCase().startsWith(searchText);
    }
    // If user is typing without $ prefix, match without the $ in completion labels
    return completion.label.toLowerCase().slice(1).startsWith(searchText);
  });

  return {
    from: word.from,
    options: filteredCompletions,
    validFor: /^[\w.$]*$/
  };
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  mode,
  placeholder,
  className,
  height = '100%',
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
        return [
          javascript(),
          autocompletion({
            override: [
              createInputObjectCompletions,
              createMethodCompletions,
              // Include default JavaScript completions
              (context: CompletionContext) => null
            ]
          })
        ];
      default:
        return html();
    }
  }, [mode]);

  return (
    <div 
      ref={editorRef}
      className={`relative ${className || ''}`}
      style={{
        height,
        overflow: 'hidden'
      }}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={[
          getLanguageExtension(),
          editorTheme,
          EditorView.lineWrapping,
          EditorView.updateListener.of(update => {
            if (update.view) {
              viewRef.current = update.view;
            }
          })
        ]}
        placeholder={placeholder}
        style={{ height: '100%' }}
        readOnly={readOnly}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightActiveLine: true
        }}
      />
    </div>
  );
};