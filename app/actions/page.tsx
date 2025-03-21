'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useFilters } from '@/hooks/useFilters';
import { useSearchParams } from 'next/navigation';
import { parseEmail } from '@/lib/utils/string';
import { EmailComposerDialog } from '@/app/components/EmailComposerDialog';
import { FilterList } from './components/FilterList';
import { FilterDetails } from './components/FilterDetails';
import { FilterRule, FilterAction, EmailData } from './types';

export default function FiltersPage() {
  const { filters, loading, error, toggleFilter, deleteFilter, runningRuleId, runRule, refresh } = useFilters();
  const searchParams = useSearchParams();
  const [selectedRule, setSelectedRule] = useState<FilterRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [currentActionIndex, setCurrentActionIndex] = useState<number | null>(null);
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

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 text-red-500">
        Error: {error}
      </div>
    );
  }

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

  const handleAddAction = () => {
    if (!selectedRule) return;
    
    // Create a temporary action with a negative ID to indicate it's new
    const newAction = {
      id: -Date.now(), // Use negative timestamp as temporary ID
      type: 'forward',
      config: {},
      order: selectedRule.actions.length
    };

    setSelectedRule({
      ...selectedRule,
      actions: [...selectedRule.actions, newAction]
    });
  };

  async function handleSave(rule: FilterRule) {
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

  async function handleDelete(id: number) {
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

  async function handleDeleteAction(ruleId: number, actionId: number) {
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

  async function handleActionsReorder(actions: FilterAction[]) {
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

  const handleSaveTemplate = (template: string, recipientExpression: string) => {
    if (currentActionIndex === null || !selectedRule) return;
    
    const newActions = [...selectedRule.actions];
    let action = newActions[currentActionIndex];
    console.log("newActions:", newActions);
    console.log("Action:", action);

    if(!action){
      action = {
        id: -Date.now(), // Use negative timestamp as temporary ID
        ruleId: selectedRule.id,
        type: 'email-relay',
        config: {
          templateType: 'html',
        },
        order: selectedRule.actions.length
      };
    }
    
    newActions[currentActionIndex] = {
      ...(action || {}),
      config: {
        ...(action.config || {}),
        [action?.config?.templateType === 'mjml' ? 'mjmlTemplate' : 'htmlTemplate']: template,
        recipientExpression: recipientExpression,
      },
    };
    
    setSelectedRule({
      ...selectedRule,
      actions: newActions,
    });
    
    toast.success('Template and recipient expression saved successfully');
  };

  const handleOpenComposer = (index: number) => {
    setCurrentActionIndex(index);
    setComposerOpen(true);
  };

  return (
    <>
      <div className="flex flex-1 h-full overflow-hidden">
        <FilterList
          filters={filters as FilterRule[]}
          selectedRule={selectedRule}
          onSelectRule={setSelectedRule}
          onToggleRule={toggleFilter}
          onAddNewRule={() => {
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
            setIsEditing(true);
          }}
        />
        <div className="w-2/3 border-r border-gray-200 overflow-hidden">
          <FilterDetails
            selectedRule={selectedRule}
            isEditing={isEditing}
            runningRuleId={runningRuleId}
            onSave={handleSave}
            onDelete={handleDelete}
            onToggleEdit={() => {
              setIsEditing(!isEditing);
              if (isEditing) {
                refresh();
              }
            }}
            onRunRule={runRule}
            onDeleteAction={handleDeleteAction}
            onActionsReorder={handleActionsReorder}
            onAddAction={handleAddAction}
            onOpenComposer={handleOpenComposer}
          />
        </div>
      </div>
      {selectedRule && (
        <EmailComposerDialog
          open={composerOpen}
          onOpenChange={setComposerOpen}
          templateType={selectedRule.actions[currentActionIndex || 0]?.config?.templateType || 'html'}
          initialTemplate={
            selectedRule.actions[currentActionIndex || 0]?.config?.templateType === 'mjml'
              ? selectedRule.actions[currentActionIndex || 0]?.config?.mjmlTemplate || ''
              : selectedRule.actions[currentActionIndex || 0]?.config?.htmlTemplate || ''
          }
          initialRecipientExpression={selectedRule.actions[currentActionIndex || 0]?.config?.recipientExpression || '{{email.toEmail}}'}
          emailData={emailData}
          onSave={handleSaveTemplate}
        />
      )}
    </>
  );
}