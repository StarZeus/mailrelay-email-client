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
  type: 'forward' | 'webhook' | 'kafka' | 'javascript';
  config: Record<string, any>;
  isEnabled: boolean;
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
              onClick={() => setSelectedRule(rule)}
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
                              config: {},
                              isEnabled: true,
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