'use client';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CopyPlus } from 'lucide-react';
import { FilterRule } from '../types';
import { useSelection } from '@/app/context/SelectionContext';
import { useState, useEffect } from 'react';
import { useFilters } from '@/hooks/useFilters';

export const FilterList = () => {
  const { filters, toggleFilter, setEditing } = useFilters();
  const { selectedItem: selectedRule, setSelectedItem: setSelectedRule } = useSelection<FilterRule>();

  const handleAddRule = () => {
    setSelectedRule({
      id: 0,
      name: 'New Rule',
      fromPattern: '',
      toPattern: '',
      subjectPattern: '',
      enabled: true,
      operator: 'AND',
      actions: [],
    });
    setEditing(true);
  }

  return (
    <div className="border-r border-gray-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h1 className="text-lg font-semibold">Filters & Actions</h1>
        <Button 
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Add new rule"
          onClick={handleAddRule}
        >
          <CopyPlus className="h-5 w-5" />
          <span className="sr-only">Add new rule</span>
        </Button>
      </div>
      <div className="divide-y divide-gray-200" data-testid="filter-list">
        {filters?.map((rule:FilterRule) => (
          <div
            key={rule.id}
            data-testid="filter-item"
            className={`p-4 cursor-pointer hover:bg-gray-50 ${
              selectedRule?.id === rule.id ? 'bg-blue-50 border-l-4 border-l-gray-200' : ''
            }`}
            onClick={() => setSelectedRule(rule)}
          >
            <div className="flex items-center justify-between">
              <span>{rule.name}</span>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={rule.enabled} 
                  onCheckedChange={() => toggleFilter(rule.id)} 
                />
              </div>
            </div>
          </div>
        ))}
        {filters?.length === 0 && (
          <div className="flex-1 flex items-center mt-10 justify-center text-gray-500">
            No filter rules found
          </div>
        )}
      </div>
    </div>
  );
}; 