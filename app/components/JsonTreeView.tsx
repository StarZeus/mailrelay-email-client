'use client';

import React, { useState } from 'react';
import { JSONTree } from 'react-json-tree';
import { cn } from '@/lib/utils';

interface JsonTreeViewProps {
  data: any;
  onDragStart?: (path: string, value: any) => void;
}

const theme = {
  scheme: 'default',
  base00: '#ffffff',
  base01: '#f5f5f5',
  base02: '#e0e0e0',
  base03: '#d0d0d0',
  base04: '#a0a0a0',
  base05: '#808080',
  base06: '#606060',
  base07: '#000000',
  base08: '#fa4d56', // red
  base09: '#ff832b', // orange
  base0A: '#f1c21b', // yellow
  base0B: '#42be65', // green
  base0C: '#08bdba', // cyan
  base0D: '#0f62fe', // blue
  base0E: '#8a3ffc', // violet
  base0F: '#ff7eb6', // pink
};

// Function to recursively filter out id fields
const filterIdFields = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => filterIdFields(item));
  }
  if (obj && typeof obj === 'object') {
    const filtered = { ...obj };
    delete filtered.id;
    for (const key in filtered) {
      filtered[key] = filterIdFields(filtered[key]);
    }
    return filtered;
  }
  return obj;
};

export const JsonTreeView: React.FC<JsonTreeViewProps> = ({ data, onDragStart }) => {
  const [expandedValues, setExpandedValues] = useState<string[]>([]);

  const toggleValueExpansion = (path: string) => {
    if (expandedValues.includes(path)) {
      setExpandedValues(expandedValues.filter(p => p !== path));
    } else {
      setExpandedValues([...expandedValues, path]);
    }
  };

  const renderLabel = (keyPath: (string | number)[], nodeType: string, expanded: boolean) => {
    const path = keyPath.slice().reverse().join('.');
    const key = keyPath[0];
    const value = nodeType === 'Object' || nodeType === 'Array' 
      ? nodeType 
      : getValueFromPath(data, keyPath.slice().reverse());

    return (
      <span
        draggable
        onDragStart={(e) => {
          if (onDragStart) {
            e.dataTransfer.setData('text/plain', `{{${path}}}`);
            onDragStart(path, value);
          }
        }}
        className={cn(
          "py-1 px-2 rounded cursor-move hover:bg-gray-100 inline-flex items-center whitespace-nowrap",
          nodeType === 'Object' || nodeType === 'Array' ? 'font-semibold' : 'font-normal'
        )}
      >
        <span className="mr-2">⋮⋮</span>
        <span>{String(key)}</span>
      </span>
    );
  };

  const renderValue = (value: any, keyPath: (string | number)[]) => {
    const path = keyPath.slice().reverse().join('.');
    
    // Handle Arrays
    if (Array.isArray(value)) {
      const template = `{{#each ${path}}}\n  {{this}}\n{{/each}}`;
      return (
        <span
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', template);
          }}
          className="whitespace-pre font-mono text-sm bg-gray-50 px-2 py-1 rounded cursor-move hover:bg-gray-100"
        >
          {template}
        </span>
      );
    }

    // Handle Objects
    if (typeof value === 'object' && value !== null) {
      const template = `{{#each ${path}}}\n  {{@key}}: {{this}}\n{{/each}}`;
      return (
        <span
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', template);
          }}
          className="whitespace-pre font-mono text-sm bg-gray-50 px-2 py-1 rounded cursor-move hover:bg-gray-100"
        >
          {template}
        </span>
      );
    }

    // Handle primitive values
    const stringValue = String(value);
    const isLongValue = stringValue.length > 50;
    const isExpanded = expandedValues.includes(path);
    
    if (!isLongValue) {
      return (
        <span
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', `{{${path}}}`);
          }}
          className="whitespace-nowrap cursor-move hover:bg-gray-50 px-1 rounded"
        >
          {stringValue}
        </span>
      );
    }
    
    return (
      <span className="whitespace-nowrap">
        <span
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', `{{${path}}}`);
          }}
          className="cursor-move hover:bg-gray-50 px-1 rounded"
        >
          {isExpanded ? stringValue : stringValue.substring(0, 50) + '...'}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleValueExpansion(path);
          }}
          className="ml-2 text-xs text-blue-500 hover:underline"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      </span>
    );
  };

  const getValueFromPath = (obj: any, path: (string | number)[]) => {
    let current = obj;
    for (let i = 0; i < path.length; i++) {
      if (current === undefined || current === null) return undefined;
      current = current[path[i]];
    }
    return current;
  };

  // Filter out id fields recursively and ensure email is the root
  const filteredData = { email: filterIdFields(data.email || data) };

  return (
    <div className="border rounded-lg p-4 bg-white h-full flex flex-col">
      <div className="font-semibold mb-2">Email Data Structure:</div>
      <div className="overflow-auto flex-grow max-h-[600px]">
        <div className="overflow-x-auto">
          <JSONTree
            data={filteredData}
            theme={theme}
            invertTheme={false}
            hideRoot={true}
            shouldExpandNodeInitially={(keyPath, value, level) => {
              return keyPath[0] === 'email';
            }}
            labelRenderer={(keyPath, nodeType, expanded) => (
              renderLabel(Array.from(keyPath), nodeType, expanded)
            )}
            valueRenderer={(value: any, keyPath: any) => renderValue(value, Array.from(keyPath || []))}
          />
        </div>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Drag variables into your template or click to copy
      </div>
    </div>
  );
}; 