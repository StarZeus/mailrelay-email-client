'use client';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { CopyPlus } from 'lucide-react';
import { FilterRule } from '../types';

interface FilterListProps {
  filters: FilterRule[];
  selectedRule: FilterRule | null;
  onSelectRule: (rule: FilterRule) => void;
  onToggleRule: (id: number) => void;
  onAddNewRule: () => void;
}

export const FilterList = ({ 
  filters, 
  selectedRule, 
  onSelectRule, 
  onToggleRule,
  onAddNewRule 
}: FilterListProps) => {
  return (
    <div className="border-r border-gray-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h1 className="text-lg font-semibold">Filters & Actions</h1>
        <Button 
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Add new rule"
          onClick={onAddNewRule}
        >
          <CopyPlus className="h-5 w-5" />
          <span className="sr-only">Add new rule</span>
        </Button>
      </div>
      <div className="divide-y divide-gray-200" data-testid="filter-list">
        {filters?.map((rule) => (
          <div
            key={rule.id}
            data-testid="filter-item"
            className={`p-4 cursor-pointer hover:bg-gray-50 ${
              selectedRule?.id === rule.id ? 'bg-blue-50 border-l-4 border-l-gray-200' : ''
            }`}
            onClick={() => onSelectRule(rule)}
          >
            <div className="flex items-center justify-between">
              <span>{rule.name}</span>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={rule.enabled} 
                  onCheckedChange={() => onToggleRule(rule.id)} 
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