'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrashIcon, Loader2, Play, Edit, Save, X, BadgePlus, ChevronUp, ChevronDown } from 'lucide-react';
import { FilterRule, FilterAction, EmailData } from '../types';
import { useFilters } from '@/hooks/useFilters';
import { SortableAction } from './SortableAction';
import { useState, useEffect } from 'react';
import { parseEmail } from '@/lib/utils/string';
import { useSelection } from '@/app/context/SelectionContext';
import { EmailComposerDialog } from '@/app/components/EmailComposerDialog';

export const FilterDetails = () => {
  const searchParams = useSearchParams();
  const { selectedItem: selectedRule, setSelectedItem: setSelectedRule } = useSelection<FilterRule>();
  const [localRule, setLocalRule] = useState<FilterRule | null>(selectedRule);
  const [isEditing, setIsEditing] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [currentActionIndex, setCurrentActionIndex] = useState<number | null>(null);
  const { editing, runningRuleId, runRule, refresh } = useFilters();
  const [emailData, setEmailData] = useState<EmailData>({
    email: {
      id: 123,
      subject: "<<Email Subject>>",
      fromEmail: "<<Sender Email>>",
      toEmail: "<<Recipient Email>>",
      body: "<<Email Body>>",
      bodyJson: {},
      sentDate: new Date().toISOString(),
      attachments: []
    }
  });

  useEffect(() => {
    const filterEmailId = searchParams.get('filterEmail');
    if (filterEmailId) {
      addNewRuleFromEmail(filterEmailId);
    }
  }, [searchParams]);
  
  useEffect(() => {
    setLocalRule(selectedRule);
  }, [selectedRule]);

  useEffect(() => {
    setIsEditing(editing);
  }, [editing]);

  async function addNewRuleFromEmail(emailId: string) {
    try {
      const emailsPromise = await fetch(`/api/emails?attachmentSchema=true&id=${emailId}`);
      const emailData = await emailsPromise.json();

      if(Array.isArray(emailData.emails) && emailData.emails.length === 0) {
        toast.error('Email not found');
        return;
      }

      const email = emailData.emails[0];
      setEmailData(email);

      setSelectedRule({
        id: 0,
        name: email.subject,
        fromPattern: parseEmail(email.fromEmail).email,
        toPattern: parseEmail(email.toEmail).email,
        subjectPattern: email.subject,
        enabled: true,
        operator: 'AND',
        actions: []
      });
      setIsEditing(true);
    } catch (error) {
      toast.error('Failed to load email data');
    }
  }

  const onToggleEdit = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      refresh();
    }
  }

  const handleMoveAction = (index: number, direction: 'up' | 'down') => {
    if (!localRule) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localRule.actions.length) return;
    
    const newActions = [...localRule.actions];
    const [movedItem] = newActions.splice(index, 1);
    newActions.splice(newIndex, 0, movedItem);
    // Refresh ui
    setLocalRule(prev => prev ? { ...prev, actions: newActions } : null);
    handleActionsReorder(newActions);
  };

  const handleLocalUpdate = (updates: Partial<FilterRule>) => {
    setLocalRule(prev => prev ? { ...prev, ...updates } : null);
  };

  const handleSave = async () => {
    if (localRule) {
      await handleSaveRule(localRule);
    }
  };

  async function handleDeleteRule(id: number) {
    try {
      const response = await fetch(`/api/filter-rules?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete rule');

      toast.success('Filter rule deleted successfully');
      refresh();
      setSelectedRule(null);
    } catch (error) {
      toast.error('Failed to delete filter rule');
    }
  }

  const handleActionsReorder = async function (actions: FilterAction[]) {
    try {
      actions.forEach((action, index) => {
        action.order = index;
      });

      if (selectedRule) {
        setSelectedRule({
          ...selectedRule,
          actions
        });
      }
    } catch (error) {
      toast.error('Failed to save action order');
    }
  }

  const handleDeleteAction = async function(ruleId: number, actionId: number) {
    if (actionId < 0) {
      // For temporary actions, just remove from local state
      if (selectedRule) {
        setSelectedRule({
          ...selectedRule,
          actions: selectedRule.actions.filter(a => a.id !== actionId)
        });
      }
      return;
    }

    // For existing actions, proceed with API call
    try {
      const response = await fetch(`/api/filter-rules/actions?ruleId=${ruleId}&actionId=${actionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete action');

      if (selectedRule) {
        setSelectedRule({
          ...selectedRule,
          actions: selectedRule.actions.filter(a => a.id !== actionId)
        });
      }

      toast.success('Action deleted successfully');
    } catch (error) {
      toast.error('Failed to delete action');
    }
  }

  async function handleSaveRule(rule: FilterRule) {
    try {
      // Filter out temporary IDs before saving
      const ruleToSave = {
        ...rule,
        actions: rule.actions.map(action => ({
          ...action,
          id: action.id > 0 ? action.id : undefined // Remove temporary IDs
        }))
      };

      const response = await fetch('/api/filter-rules', {
        method: rule.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleToSave),
      });

      if (!response.ok) throw new Error('Failed to save rule');

      toast.success('Filter rule saved successfully');
      setSelectedRule(rule);
      refresh();
      setIsEditing(false);
    } catch (error) {
      toast.error('Failed to save filter rule');
    }
  }

  const handleOpenComposer = (index: number) => {
    setCurrentActionIndex(index);
    setComposerOpen(true);
  };

  const handleSaveTemplate = (template: string, recipientExpression: string) => {
    if (currentActionIndex === null || !localRule) return;
    
    const newActions = [...localRule.actions];
    let action = newActions[currentActionIndex];

    if(!action){
      action = {
        id: -Date.now(),
        ruleId: localRule.id,
        type: 'email-relay',
        config: {
          templateType: 'html',
          htmlTemplate: '',
          recipientExpression: '{{email.toEmail}}'
        },
        order: localRule.actions.length
      };
    }
    
    const templateType = action.config?.templateType || 'html';
    newActions[currentActionIndex] = {
      ...action,
      config: {
        ...action.config,
        templateType,
        [templateType === 'mjml' ? 'mjmlTemplate' : 'htmlTemplate']: template,
        recipientExpression
      }
    };
    
    setSelectedRule({
      ...selectedRule,
      actions: newActions,
    });
    
    toast.success('Template and recipient expression saved successfully');
  };

  if (!localRule) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Select a rule to view or edit its details
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-4 border-b border-gray-200 flex justify-between items-center">
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
                onClick={() => runRule(localRule.id)}
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
                onClick={() => handleDeleteRule(localRule.id)}
              >
                <TrashIcon className="h-5 w-5" />
                <span className="sr-only">Delete rule</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
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
                          type: 'email-relay',
                          config: {
                            templateType: 'html',
                            htmlTemplate: '',
                            recipientExpression: '{{email.toEmail}}'
                          },
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
                      onDelete={() => handleDeleteAction(localRule.id, action.id)}
                      onChange={(updatedAction) => {
                        const newActions = [...localRule.actions];
                        newActions[index] = updatedAction;
                        handleLocalUpdate({ actions: newActions });
                      }}
                      onMoveAction={(direction) => handleMoveAction(index, direction)}
                      totalActions={localRule.actions.length}
                      onOpenComposer={handleOpenComposer}
                    />
                  </div>
                </div>
              ))}
              {selectedRule && (
                <EmailComposerDialog
                  open={composerOpen}
                  onOpenChange={setComposerOpen}
                  templateType={localRule.actions[currentActionIndex || 0]?.config?.templateType || 'html'}
                  initialTemplate={
                    localRule.actions[currentActionIndex || 0]?.config?.templateType === 'mjml'
                      ? localRule.actions[currentActionIndex || 0]?.config?.mjmlTemplate || ''
                      : localRule.actions[currentActionIndex || 0]?.config?.htmlTemplate || ''
                  }
                  initialRecipientExpression={localRule.actions[currentActionIndex || 0]?.config?.recipientExpression || '{{email.toEmail}}'}
                  emailData={emailData}
                  onSave={handleSaveTemplate}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 