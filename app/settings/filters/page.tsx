'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { TrashIcon, Loader2, Maximize2 } from 'lucide-react';
import { useFilters } from '@/hooks/useFilters';
import { cn } from '@/lib/utils/string';
import { useSearchParams } from 'next/navigation';
import { parseEmail } from '@/lib/utils/string';
import { EmailComposerDialog } from '@/app/components/EmailComposerDialog';
import { CodeEditor } from '@/app/components/CodeEditor';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FilterList } from './components/FilterList';
import { FilterDetails } from './components/FilterDetails';
import { FilterRule, FilterAction, EmailData } from './types';


const SortableAction = ({ action, index, isEditing, onDelete, onChange }:FilterRule) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: action.id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style} className="relative">
      {isEditing && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute left-0 top-0 bottom-0 w-8 cursor-move flex items-center justify-center hover:bg-gray-100 rounded-l"
        >
          ⋮⋮
        </div>
      )}
      <CardContent className={cn("pt-6", isEditing && "pl-8")}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Select
              value={action.type}
              onValueChange={(value: any) => {
                const newActions = [...selectedRule?.actions];
                newActions[index] = {
                  ...action,
                  type: value,
                  config: {},
                };
                setSelectedRule({
                  ...selectedRule,
                  actions: newActions,
                });
              }}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="forward">Forward</SelectItem>
                <SelectItem value="webhook">Webhook</SelectItem>
                <SelectItem value="kafka">Kafka</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="email-relay">Email Relay</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              title="Delete action"
              onClick={() => onDelete()}
              disabled={!isEditing}
            >
              <TrashIcon className="h-5 w" />
              <span className="sr-only">Delete action</span>
            </Button>

          </div>

          {action.type === 'forward' && (
            <div>
              <Label>Forward To</Label>
              <Input
                value={action.config.forwardTo || ''}
                onChange={(e) => {
                  const newActions = [...selectedRule.actions];
                  newActions[index] = {
                    ...action,
                    config: {
                      ...action.config,
                      forwardTo: e.target.value,
                    },
                  };
                  setSelectedRule({
                    ...selectedRule,
                    actions: newActions,
                  });
                }}
                disabled={!isEditing}
              />
            </div>
          )}

          {action.type === 'webhook' && (
            <div className="space-y-4">
              <div>
                <Label>URL</Label>
                <Input
                  value={action.config.url || ''}
                  onChange={(e) => {
                    const newActions = [...selectedRule.actions];
                    newActions[index] = {
                      ...action,
                      config: {
                        ...action.config,
                        url: e.target.value,
                      },
                    };
                    setSelectedRule({
                      ...selectedRule,
                      actions: newActions,
                    });
                  }}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label>Method</Label>
                <Select
                  value={action.config.method || 'POST'}
                  onValueChange={(value) => {
                    const newActions = [...selectedRule.actions];
                    newActions[index] = {
                      ...action,
                      config: {
                        ...action.config,
                        method: value,
                      },
                    };
                    setSelectedRule({
                      ...selectedRule,
                      actions: newActions,
                    });
                  }}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {action.type === 'kafka' && (
            <div className="space-y-4">
              <div>
                <Label>Topic</Label>
                <Input
                  value={action.config.topic || ''}
                  onChange={(e) => {
                    const newActions = [...selectedRule.actions];
                    newActions[index] = {
                      ...action,
                      config: {
                        ...action.config,
                        topic: e.target.value,
                      },
                    };
                    setSelectedRule({
                      ...selectedRule,
                      actions: newActions,
                    });
                  }}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label>Brokers (comma-separated)</Label>
                <Input
                  value={
                    Array.isArray(action.config.brokers)
                      ? action.config.brokers.join(',')
                      : ''
                  }
                  onChange={(e) => {
                    const newActions = [...selectedRule.actions];
                    newActions[index] = {
                      ...action,
                      config: {
                        ...action.config,
                        brokers: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      },
                    };
                    setSelectedRule({
                      ...selectedRule,
                      actions: newActions,
                    });
                  }}
                  disabled={!isEditing}
                />
              </div>
            </div>
          )}

          {action.type === 'javascript' && (
            <div>
              <Label>JavaScript Code</Label>
              <div className="grid grid-cols-2 gap-4 mt-2 h-[500px]">
                <div className="h-full">
                  <CodeEditor
                    value={action.config.code || ''}
                    onChange={(value) => {
                      const newActions = [...selectedRule.actions];
                      newActions[index] = {
                        ...action,
                        config: {
                          ...action.config,
                          code: value,
                        },
                      };
                      setSelectedRule({
                        ...selectedRule,
                        actions: newActions,
                      });
                    }}
                    mode="javascript"
                    readOnly={!isEditing}
                    height="100%"
                  />
                </div>
                <div className="border rounded-lg p-4 overflow-auto h-full">
                  <div className="font-semibold mb-2">Script Help</div>
                  <div className="space-y-4">
                    <div>
                      <div className="font-semibold mb-2">Available Variables:</div>
                      <pre className="text-xs bg-gray-50 p-2 rounded">
{`email: {
  id: number            // Unique ID of the email
  fromEmail: string     // Sender's email address
  toEmail: string       // Recipient's email address
  subject: string|null  // Email subject line
  body: string|null     // Email body content
  sentDate: Date        // When email was sent
}`}
                      </pre>
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Available Functions:</div>
                      <pre className="text-xs bg-gray-50 p-2 rounded">
{`console.log()    // Log info messages
console.error()  // Log error messages
fetch()         // Make HTTP requests
setTimeout()    // Delay execution
clearTimeout()  // Clear a timeout
Promise         // Work with promises`}
                      </pre>
                    </div>
                    <div>
                      <div className="font-semibold mb-2">Example:</div>
                      <pre className="text-xs bg-gray-50 p-2 rounded">
{`// Send email data to external API
await fetch('https://api.example.com', {
  method: 'POST',
  body: JSON.stringify({ emailId: email.id })
});

// Process email content
if (email.subject.includes('urgent')) {
  console.log('Processing urgent email');
  // Your urgent handling logic
}`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {action.type === 'email-relay' && (
            <div className="space-y-4">
              <div>
                <Label>Template Type</Label>
                <Select
                  value={action.config.templateType || 'html'}
                  onValueChange={(value) => {
                    const newActions = [...selectedRule.actions];
                    newActions[index] = {
                      ...action,
                      config: {
                        ...action.config,
                        templateType: value,
                      },
                    };
                    setSelectedRule({
                      ...selectedRule,
                      actions: newActions,
                    });
                  }}
                  disabled={!isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="html">HTML Template</SelectItem>
                    <SelectItem value="mjml">MJML Template</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>{action.config.templateType === 'mjml' ? 'MJML Template' : 'HTML Template'}</Label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    title="Open in composer"
                    onClick={() => handleOpenComposer(index)}
                    disabled={!isEditing}
                  >
                    <Maximize2 className="h-5 w-5" />
                    <span className="sr-only">Open in composer</span>
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className="relative"
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const target = e.currentTarget;
                      target.classList.add('bg-blue-50', 'border-blue-300');
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const target = e.currentTarget;
                      target.classList.remove('bg-blue-50', 'border-blue-300');
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const target = e.currentTarget;
                      target.classList.remove('bg-blue-50', 'border-blue-300');

                      const files = Array.from(e.dataTransfer.files);
                      const file = files[0];
                      
                      if (!file) return;

                      // Validate file type
                      const isHTML = file.name.endsWith('.html') || file.name.endsWith('.htm');
                      const isMJML = file.name.endsWith('.mjml');
                      
                      if (!isHTML && !isMJML) {
                        toast.error('Please drop a valid template file (.html, .htm, or .mjml)');
                        return;
                      }

                      // Check if file type matches selected template type
                      if ((isHTML && action.config.templateType === 'mjml') || 
                          (isMJML && action.config.templateType === 'html')) {
                        toast.error(`Please drop a ${action.config.templateType.toUpperCase()} file`);
                        return;
                      }

                      try {
                        const content = await file.text();
                        const newActions = [...selectedRule.actions];
                        newActions[index] = {
                          ...action,
                          config: {
                            ...action.config,
                            [action.config.templateType === 'mjml' ? 'mjmlTemplate' : 'htmlTemplate']: content,
                          },
                        };
                        setSelectedRule({
                          ...selectedRule,
                          actions: newActions,
                        });
                        toast.success('Template loaded successfully');
                      } catch (error) {
                        toast.error('Failed to load template file');
                        console.error('Error loading template:', error);
                      }
                    }}
                  >
                    <CodeEditor
                      value={action.config.templateType === 'mjml' ? (action.config.mjmlTemplate || '') : (action.config.htmlTemplate || '')}
                      onChange={(value) => {
                        const newActions = [...selectedRule.actions];
                        newActions[index] = {
                          ...action,
                          config: {
                            ...action.config,
                            [action.config.templateType === 'mjml' ? 'mjmlTemplate' : 'htmlTemplate']: value,
                          },
                        };
                        setSelectedRule({
                          ...selectedRule,
                          actions: newActions,
                        });
                      }}
                      mode={action.config.templateType}
                      readOnly={!isEditing}
                      height="400px"
                      placeholder={action.config.templateType === 'mjml' ? 
                        `<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text>{{email.subject}}</mj-text>
        <mj-divider />
        <mj-text>{{{email.body}}}</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>` : 
                        `<!DOCTYPE html><html><head><title>{{email.subject}}</title></head><body>...</body></html>`
                      }
                    />
                    <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-transparent transition-colors duration-200">
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 bg-blue-50/50 transition-opacity duration-200">
                        <p className="text-blue-600 text-center">
                          Drop your {action.config.templateType === 'mjml' ? 'MJML' : 'HTML'} template file here
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="font-semibold mb-2">Available Email Data:</div>
                    <div className="space-y-2 text-sm">
                      {[
                        { key: 'email.subject', value: '{{email.subject}}' },
                        { key: 'email.fromEmail', value: '{{email.fromEmail}}' },
                        { key: 'email.toEmail', value: '{{email.toEmail}}' },
                        { key: 'email.body', value: '{{{email.body}}}', note: '(unescaped HTML)' }
                      ].map((item) => (
                        <div
                          key={item.key}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', item.value);
                          }}
                          className="p-2 bg-gray-50 rounded cursor-move hover:bg-gray-100 flex items-center"
                        >
                          <span className="mr-2">⋮⋮</span>
                          <span>{item.key}</span>
                          {item.note && <span className="ml-2 text-gray-500 text-xs">{item.note}</span>}
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-xs text-gray-500">
                      Drag variables into your template or click to copy
                    </div>
                    {action.config.templateType === 'mjml' && (
                      <div className="mt-4 p-2 bg-blue-50 rounded text-xs">
                        <div className="font-semibold">MJML Tips:</div>
                        <ul className="list-disc list-inside mt-1">
                          <li>Use {'<mj-text>'} for text content</li>
                          <li>Use {'<mj-image>'} for images</li>
                          <li>Use {'<mj-divider>'} for horizontal lines</li>
                          <li>Use {'<mj-button>'} for buttons</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Label>Recipient Expression</Label>
                <Input
                  value={action.config.recipientExpression || ''}
                  onChange={(e) => {
                    const newActions = [...selectedRule.actions];
                    newActions[index] = {
                      ...action,
                      config: {
                        ...action.config,
                        recipientExpression: e.target.value,
                      },
                    };
                    setSelectedRule({
                      ...selectedRule,
                      actions: newActions,
                    });
                  }}
                  disabled={!isEditing}
                  placeholder="email.toEmail or custom expression to extract recipients"
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

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
      const emailsPromise = await fetch(`/api/emails?id=${emailId}`);
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
    const action = newActions[currentActionIndex];
    
    newActions[currentActionIndex] = {
      ...action,
      config: {
        ...action.config,
        [action.config.templateType === 'mjml' ? 'mjmlTemplate' : 'htmlTemplate']: template,
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
          initialRecipientExpression={selectedRule.actions[currentActionIndex || 0]?.config?.recipientExpression || 'email.toEmail'}
          emailData={emailData}
          onSave={handleSaveTemplate}
        />
      )}
    </>
  );
}