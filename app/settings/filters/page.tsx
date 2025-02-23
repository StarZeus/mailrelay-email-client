'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { TrashIcon, Loader2 } from 'lucide-react';
import { useFilters } from '@/hooks/useFilters';

interface FilterRule {
  id: number;
  name: string;
  fromPattern: string | null;
  toPattern: string | null;
  subjectPattern: string | null;
  enabled: boolean;
  operator: 'AND' | 'OR';
  actions: FilterAction[];
}

interface FilterAction {
  id: number;
  ruleId: number;
  type: 'forward' | 'webhook' | 'kafka' | 'javascript' | 'email-relay';
  config: Record<string, any>
}

export default function FiltersPage() {
  const { filters, loading, error, toggleFilter, deleteFilter, runningRuleId, runRule, refresh } = useFilters();
  const [selectedRule, setSelectedRule] = useState<FilterRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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

  async function handleSave(rule: FilterRule) {
    try {
      const response = await fetch('/api/filter-rules', {
        method: rule.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
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
    try {
      const response = await fetch(`/api/filter-rules/actions?ruleId=${ruleId}&actionId=${actionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete action');

      setSelectedRule(prev => {
        if (!prev) return null;
        return {
          ...prev,
          actions: prev.actions.filter(a => a.id !== actionId)
        };
      });

      toast.success('Action deleted successfully');
    } catch (error) {
      toast.error('Failed to delete action');
    }
  }

  async function handleToggle(id: number) {
    try {
      const response = await fetch(`/api/filter-rules`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !selectedRule?.enabled })
      });
      if (!response.ok) throw new Error('Failed to toggle rule');

      refresh();
    } catch (error) {
      toast.error('Failed to toggle filter rule');
    }
  }

  return (
    <>
      {/* Rules List */}
      <div className="w-[400px] border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-lg font-semibold">Filters & Actions</h1>
          <Button 
            size="sm"
            onClick={() => {
              setSelectedRule({
                id: 0,
                name: '',
                fromPattern: '',
                toPattern: '',
                subjectPattern: '',
                enabled: true,
                operator: 'AND',
                actions: [],
              });
              setIsEditing(true);
            }}
          >
            New Rule
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
              onClick={() => setSelectedRule({
                id: rule.id,
                name: rule.name,
                fromPattern: rule.fromPattern,
                toPattern: rule.toPattern,
                subjectPattern: rule.subjectPattern,
                enabled: rule.enabled,
                operator: rule.operator,
                actions: rule.actions.map(a => ({
                  id: a.id,
                  ruleId: a.ruleId,
                  type: a.type,
                  config: a.config,
                  isEnabled: a.isEnabled
                }))
              })}
            >
              <div className="flex items-center justify-between">
                <span>{rule.name}</span>
                <div className="flex items-center gap-2">
                  <Switch checked={rule?.enabled ?? false} onCheckedChange={() => handleToggle(rule.id)} />
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

      {/* Rule Details */}
      <div className="flex-1 overflow-y-auto">
        {selectedRule ? (
          <div className="h-full">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">
                  {isEditing ? 'Edit Rule' : 'Rule Details'}
                </h2>
              </div>
              <div className="space-x-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditing(false);
                        refresh();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      type="submit"
                      onClick={() => handleSave(selectedRule)}
                    >
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runRule(selectedRule.id)}
                      disabled={runningRuleId === selectedRule.id || !selectedRule.enabled}
                    >
                      {runningRuleId === selectedRule.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Running...
                        </>
                      ) : (
                        'Run Rule'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this rule?')) {
                          handleDelete(selectedRule.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </div>

            <form data-testid="filter-form" className="p-6 space-y-6" onSubmit={(e) => {
              e.preventDefault();
            }}>
              {/* Rule Settings */}
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={selectedRule.name}
                    onChange={(e) =>
                      setSelectedRule({
                        ...selectedRule,
                        name: e.target.value,
                      })
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label>Logical Operator</Label>
                  <Select
                    value={selectedRule.operator}
                    onValueChange={(value: 'AND' | 'OR') =>
                      setSelectedRule({
                        ...selectedRule,
                        operator: value,
                      })
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
                    name="fromPattern"
                    value={selectedRule?.fromPattern ?? ''}
                    onChange={(e) =>
                      setSelectedRule(rule => rule ? {
                        ...rule,
                        fromPattern: e.target.value,
                      } : null)
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label>To Pattern</Label>
                  <Input
                    name="toPattern"
                    value={selectedRule?.toPattern ?? ''}
                    onChange={(e) =>
                      setSelectedRule(rule => rule ? {
                        ...rule,
                        toPattern: e.target.value,
                      } : null)
                    }
                    disabled={!isEditing}
                  />
                </div>

                <div>
                  <Label>Subject Pattern</Label>
                  <Input
                    name="condition"
                    value={selectedRule?.subjectPattern ?? ''}
                    onChange={(e) =>
                      setSelectedRule(rule => rule ? {
                        ...rule,
                        subjectPattern: e.target.value,
                      } : null)
                    }
                    disabled={!isEditing}
                  />
                </div>
                {isEditing && !selectedRule.name && (
                  <div data-testid="error-message" className="text-red-500">
                    Name is required
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Actions</h3>
                  {isEditing && (
                    <Button
                      type="button"
                      onClick={() => {
                        setSelectedRule({
                          ...selectedRule,
                          actions: [
                            ...selectedRule?.actions || [],
                            {
                              id: -Date.now(),
                              ruleId: selectedRule.id,
                              type: 'forward',
                              config: {}
                            },
                          ],
                        });
                      }}
                    >
                      Add Action
                    </Button>
                  )}
                </div>
                {(!selectedRule?.actions || selectedRule?.actions?.length === 0) && (
                  <div className="text-gray-500">
                    No actions found
                  </div>
                )}

                {selectedRule?.actions?.map((action, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
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
                            variant="destructive"
                            size="sm"
                            className="ml-2"
                            onClick={() => handleDeleteAction(selectedRule.id, action.id)}
                            disabled={!isEditing}
                          >
                            <TrashIcon className="w-4 h-4" />
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
                            <div className="mb-4">
                              <div className="flex items-center p-2 bg-gray-100 rounded-t-lg cursor-pointer hover:bg-gray-200 transition-colors" 
                                   onClick={() => {
                                     const helpPanel = document.getElementById(`help-panel-${index}`);
                                     if (helpPanel) {
                                       helpPanel.style.display = helpPanel.style.display === 'none' ? 'block' : 'none';
                                     }
                                   }}>
                                <div className="font-semibold">📘 Script Help</div>
                                <div className="ml-2 text-xs text-gray-500">(click to toggle)</div>
                              </div>
                              <div id={`help-panel-${index}`} className="p-4 bg-gray-50 rounded-b-lg border-t border-gray-200 text-sm font-mono">
                                <div className="font-semibold mb-2">Available Variables:</div>
                                <pre className="text-xs">
{`email: {
  id: number            // Unique ID of the email
  fromEmail: string     // Sender's email address
  toEmail: string       // Recipient's email address
  subject: string|null  // Email subject line
  body: string|null     // Email body content
  sentDate: Date        // When email was sent
}`}
                                </pre>
                                <div className="font-semibold mt-4 mb-2">Available Functions:</div>
                                <pre className="text-xs">
{`console.log()    // Log info messages
console.error()  // Log error messages
fetch()         // Make HTTP requests
setTimeout()    // Delay execution
clearTimeout()  // Clear a timeout
Promise         // Work with promises

Example:
await fetch('https://api.example.com', {
  method: 'POST',
  body: JSON.stringify({ emailId: email.id })
});`}
                                </pre>              
                              </div>
                            </div>
                            <Textarea
                              value={action.config.code || ''}
                              onChange={(e) => {
                                const newActions = [...selectedRule.actions];
                                newActions[index] = {
                                  ...action,
                                  config: {
                                    ...action.config,
                                    code: e.target.value,
                                  },
                                };
                                setSelectedRule({
                                  ...selectedRule,
                                  actions: newActions,
                                });
                              }}
                              disabled={!isEditing}
                              className="font-mono"
                              rows={10}
                            />
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
                              <Label>{action.config.templateType === 'mjml' ? 'MJML Template' : 'HTML Template'}</Label>
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
                                  <Textarea
                                    value={action.config.templateType === 'mjml' ? (action.config.mjmlTemplate || '') : (action.config.htmlTemplate || '')}
                                    onChange={(e) => {
                                      const newActions = [...selectedRule.actions];
                                      newActions[index] = {
                                        ...action,
                                        config: {
                                          ...action.config,
                                          [action.config.templateType === 'mjml' ? 'mjmlTemplate' : 'htmlTemplate']: e.target.value,
                                        },
                                      };
                                      setSelectedRule({
                                        ...selectedRule,
                                        actions: newActions,
                                      });
                                    }}
                                    disabled={!isEditing}
                                    className="font-mono h-[400px]"
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
                ))}
              </div>
            </form>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a rule to view or edit its details
          </div>
        )}
      </div>
    </>
  );
} 