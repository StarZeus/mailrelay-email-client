'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrashIcon, Loader2, Play, Edit, Save, X, BadgePlus, ChevronUp, ChevronDown } from 'lucide-react';
import { FilterRule, FilterAction } from '../types';
import { SortableAction } from './SortableAction';
import { useState, useEffect } from 'react';

interface FilterDetailsProps {
  selectedRule: FilterRule | null;
  isEditing: boolean;
  runningRuleId: number | null;
  onSave: (rule: FilterRule) => void;
  onDelete: (id: number) => void;
  onToggleEdit: () => void;
  onRunRule: (id: number) => void;
  onDeleteAction: (ruleId: number, actionId: number) => void;
  onActionsReorder: (actions: FilterAction[]) => void;
  onAddAction: () => void;
  onOpenComposer?: (index: number) => void;
}

export const FilterDetails = ({
  selectedRule,
  isEditing,
  runningRuleId,
  onSave,
  onDelete,
  onToggleEdit,
  onRunRule,
  onDeleteAction,
  onActionsReorder,
  onAddAction,
  onOpenComposer,
}: FilterDetailsProps) => {
  const [localRule, setLocalRule] = useState<FilterRule | null>(selectedRule);

  useEffect(() => {
    setLocalRule(selectedRule);
  }, [selectedRule]);

  const handleMoveAction = (index: number, direction: 'up' | 'down') => {
    if (!localRule) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localRule.actions.length) return;
    
    const newActions = [...localRule.actions];
    const [movedItem] = newActions.splice(index, 1);
    newActions.splice(newIndex, 0, movedItem);
    // Refresh ui
    setLocalRule(prev => prev ? { ...prev, actions: newActions } : null);
    onActionsReorder(newActions);
  };

  const handleLocalUpdate = (updates: Partial<FilterRule>) => {
    setLocalRule(prev => prev ? { ...prev, ...updates } : null);
  };

  const handleSave = () => {
    if (localRule) {
      onSave(localRule);
    }
  };

  if (!localRule) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select a rule to view or edit its details
      </div>
    );
  }

  return (
    <>
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">
          {isEditing ? 'Edit Rule' : 'Rule Details'}
        </h2>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Cancel"
                onClick={() => {
                  setLocalRule(selectedRule);
                  onToggleEdit();
                }}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Cancel</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Save rule"
                onClick={handleSave}
              >
                <Save className="h-5 w-5" />
                <span className="sr-only">Save rule</span>
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Run rule"
                onClick={() => onRunRule(localRule.id)}
                disabled={runningRuleId === localRule.id || !localRule.enabled}
              >
                {runningRuleId === localRule.id ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
                <span className="sr-only">Run rule</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Edit rule"
                onClick={onToggleEdit}
              >
                <Edit className="h-5 w-5" />
                <span className="sr-only">Edit rule</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete rule"
                onClick={() => onDelete(localRule.id)}
              >
                <TrashIcon className="h-5 w-5" />
                <span className="sr-only">Delete rule</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-auto">
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input
              value={localRule.name}
              onChange={(e) => handleLocalUpdate({ name: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Logical Operator</Label>
            <Select
              value={localRule.operator}
              onValueChange={(value: 'AND' | 'OR') => 
                handleLocalUpdate({ operator: value })
              }
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">Match ALL conditions (AND)</SelectItem>
                <SelectItem value="OR">Match ANY condition (OR)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>From Pattern</Label>
            <Input
              value={localRule.fromPattern || ''}
              onChange={(e) => handleLocalUpdate({ fromPattern: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>To Pattern</Label>
            <Input
              value={localRule.toPattern || ''}
              onChange={(e) => handleLocalUpdate({ toPattern: e.target.value })}
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label>Subject Pattern</Label>
            <Input
              value={localRule.subjectPattern || ''}
              onChange={(e) => handleLocalUpdate({ subjectPattern: e.target.value })}
              disabled={!isEditing}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Actions</h3>
            {isEditing && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Add new action"
                onClick={() => {
                  handleLocalUpdate({
                    actions: [
                      ...localRule.actions,
                      {
                        id: -Date.now(),
                        ruleId: localRule.id,
                        type: 'forward',
                        config: {},
                        order: localRule.actions.length
                      },
                    ],
                  });
                }}
              >
                <BadgePlus className="h-5 w-5" />
                <span className="sr-only">Add new action</span>
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {localRule.actions.map((action, index) => (
              <div key={action.id} className="flex gap-2">
                <div className="flex-1">
                  <SortableAction
                    key={action.id}
                    action={action}
                    index={index}
                    isEditing={isEditing}
                    onDelete={() => onDeleteAction(localRule.id, action.id)}
                    onChange={(updatedAction) => {
                      const newActions = [...localRule.actions];
                      newActions[index] = updatedAction;
                      handleLocalUpdate({ actions: newActions });
                    }}
                    onMoveAction={(direction) => handleMoveAction(index, direction)}
                    totalActions={localRule.actions.length}
                    onOpenComposer={onOpenComposer}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}; 