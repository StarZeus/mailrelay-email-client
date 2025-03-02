'use client';

import React, { useState, useCallback } from 'react';
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
  const [draggedPath, setDraggedPath] = useState<string | null>(null);

  const createDragImage = (displayText: string) => {
    const div = document.createElement('div');
    div.style.position = 'fixed';
    div.style.left = '-1000px';
    div.style.top = '0';
    div.style.padding = '8px 12px';
    div.style.background = '#ffffff';
    div.style.border = '1px solid #e2e8f0';
    div.style.borderRadius = '4px';
    div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    div.style.fontSize = '14px';
    div.style.color = '#1a202c';
    div.style.pointerEvents = 'none';
    div.style.zIndex = '9999';
    div.style.whiteSpace = 'nowrap';
    div.style.userSelect = 'none';
    div.textContent = displayText;
    document.body.appendChild(div);
    return div;
  };

  const setupDragImage = (e: React.DragEvent, path: string, template: string) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'copy';
    const dragImage = createDragImage(path);
    e.dataTransfer.setDragImage(dragImage, -10, -10);
    e.dataTransfer.setData('text/plain', template);
    setTimeout(() => {
      if (dragImage.parentNode) {
        document.body.removeChild(dragImage);
      }
    }, 100);
  };

  const toggleValueExpansion = (path: string) => {
    if (expandedValues.includes(path)) {
      setExpandedValues(expandedValues.filter(p => p !== path));
    } else {
      setExpandedValues([...expandedValues, path]);
    }
  };

  const createArrayTemplate = (path: string) => {
    // Check if it's a nested array of objects
    const pathParts = path.split('.');
    const value = getValueFromPath(data, pathParts.reverse());
    
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      return `{{#each ${path}}}
  {{#with this}}
    {{#each this}}
      {{@key}}: {{this}}
    {{/each}}
  {{/with}}
{{/each}}`;
    }
    
    // Simple array
    return `{{#each ${path}}}
  {{this}}
{{/each}}`;
  };

  const renderLabel = (keyPath: (string | number)[], nodeType: string, expanded: boolean) => {
    const path = keyPath.slice().reverse().join('.');
    const key = keyPath[0];
    const value = getValueFromPath(data, keyPath.slice().reverse());

    const getTemplate = () => {
      if (nodeType === 'Array' || Array.isArray(value)) {
        return createArrayTemplate(path);
      }
      return `{{${path}}}`;
    };

    return (
      <span
        draggable="true"
        onDragStart={(e) => {
          setDraggedPath(path);
          const template = getTemplate();
          setupDragImage(e, path, template);
          e.dataTransfer.setData('text/plain', template);
          if (onDragStart) {
            onDragStart(path, value);
          }
        }}
        onDragEnd={() => setDraggedPath(null)}
        className={cn(
          "py-1 px-2 rounded cursor-move hover:bg-gray-100 inline-flex items-center whitespace-nowrap select-none",
          nodeType === 'Object' || nodeType === 'Array' ? 'font-semibold' : 'font-normal',
          draggedPath === path && 'bg-blue-100 opacity-50'
        )}
      >
        <span className="mr-2">⋮⋮</span>
        <span>{String(key)}</span>
      </span>
    );
  };

  const createDragHandler = useCallback((path: string, template: string, value?: any) => (e: React.DragEvent) => {
    setDraggedPath(path);
    setupDragImage(e, path, template);
    if (onDragStart && value !== undefined) {
      onDragStart(path, value);
    }
  }, [onDragStart]);

  const createDragEndHandler = useCallback(() => () => {
    setDraggedPath(null);
  }, []);

  const createObjectTemplate = (path: string) => `{{#each ${path}}}\n  {{@key}}: {{this}}\n{{/each}}`;

  const createValueTemplate = (path: string) => `{{${path}}}`;

  const renderValue = useCallback((value: any, keyPath: (string | number)[]) => {
    const path = keyPath.slice().reverse().join('.');
    
    // Handle Arrays
    if (Array.isArray(value)) {
      const template = createArrayTemplate(path);
      return (
        <span
          draggable="true"
          onDragStart={(e) => {
            setDraggedPath(path);
            e.dataTransfer.setData('text/plain', template);
            setupDragImage(e, path, template);
          }}
          onDragEnd={createDragEndHandler()}
          className={cn(
            "whitespace-pre font-mono text-sm bg-gray-50 px-2 py-1 rounded cursor-move hover:bg-gray-100 select-none",
            draggedPath === path && 'bg-blue-100 opacity-50'
          )}
        >
          {template}
        </span>
      );
    }

    // Handle Objects
    if (typeof value === 'object' && value !== null) {
      const template = createObjectTemplate(path);
      return (
        <span
          draggable="true"
          onDragStart={(e) => {
            setDraggedPath(path);
            e.dataTransfer.setData('text/plain', template);
            setupDragImage(e, path, template);
          }}
          onDragEnd={createDragEndHandler()}
          className={cn(
            "whitespace-pre font-mono text-sm bg-gray-50 px-2 py-1 rounded cursor-move hover:bg-gray-100 select-none",
            draggedPath === path && 'bg-blue-100 opacity-50'
          )}
        >
          {template}
        </span>
      );
    }

    // Handle primitive values
    const stringValue = String(value);
    const isLongValue = stringValue.length > 50;
    const isExpanded = expandedValues.includes(path);
    const template = createValueTemplate(path);
    
    if (!isLongValue) {
      return (
        <span
          draggable="true"
          onDragStart={createDragHandler(path, template, value)}
          onDragEnd={createDragEndHandler()}
          className={cn(
            "whitespace-nowrap cursor-move hover:bg-gray-50 px-1 rounded select-none",
            draggedPath === path && 'bg-blue-100 opacity-50'
          )}
        >
          {stringValue}
        </span>
      );
    }
    
    return (
      <span className="whitespace-nowrap">
        <span
          draggable="true"
          onDragStart={createDragHandler(path, template, value)}
          onDragEnd={createDragEndHandler()}
          className={cn(
            "cursor-move hover:bg-gray-50 px-1 rounded select-none",
            draggedPath === path && 'bg-blue-100 opacity-50'
          )}
        >
          {isExpanded ? stringValue : stringValue.substring(0, 50) + '...'}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleValueExpansion(path);
          }}
          className="ml-2 text-xs text-blue-500 hover:underline select-none"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      </span>
    );
  }, [createDragHandler, createDragEndHandler, draggedPath, expandedValues]);

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
            labelRenderer={(keyPath, nodeType, expanded, value) => (
              renderLabel(Array.from(keyPath), nodeType, expanded)
            )}
            valueRenderer={(value: any, keyPath: any) => renderValue(value, Array.from(keyPath || []))}
          />
        </div>
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Drag values to insert template variables
      </div>
    </div>
  );
};