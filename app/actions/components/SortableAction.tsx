'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrashIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { SortableActionProps } from '../types';
import { ForwardConfig } from './action-types/ForwardConfig';
import { WebhookConfig } from './action-types/WebhookConfig';
import { KafkaConfig } from './action-types/KafkaConfig';
import { JavaScriptConfig } from './action-types/JavaScriptConfig';
import { EmailRelayConfig } from './action-types/EmailRelayConfig';

export const SortableAction = ({ action, index, isEditing, onDelete, onChange, onMoveAction, totalActions, onOpenComposer }: SortableActionProps) => {
  const renderActionConfig = () => {
    switch (action.type) {
      case 'forward':
        return <ForwardConfig action={action} isEditing={isEditing} onChange={onChange} />;
      case 'webhook':
        return <WebhookConfig action={action} isEditing={isEditing} onChange={onChange} />;
      case 'kafka':
        return <KafkaConfig action={action} isEditing={isEditing} onChange={onChange} />;
      case 'javascript':
        return <JavaScriptConfig action={action} isEditing={isEditing} onChange={onChange} />;
      case 'email-relay':
        return (
          <EmailRelayConfig 
            action={action} 
            isEditing={isEditing} 
            onChange={onChange}
            index={index}
            onOpenComposer={onOpenComposer}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Select
              value={action.type}
              onValueChange={(value: any) => {
                onChange({
                  ...action,
                  type: value as typeof action.type,
                  config: {},
                });
              }}
              disabled={!isEditing}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select action type" />
              </SelectTrigger>
                <SelectContent>
                {[
                  { value: 'forward', label: 'Forward' },
                  { value: 'webhook', label: 'Webhook' },
                  { value: 'kafka', label: 'Kafka' },
                  { value: 'javascript', label: 'Transform with Javascript' },
                  { value: 'email-relay', label: 'Email Relay' },
                ]
                  .sort((a, b) => a.label.localeCompare(b.label))
                  .map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                  ))}
                </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center rounded-full bg-gray-200 px-2.5 mx-2 py-0.5 text-xs font-medium text-gray-500">{index + 1}</span>
              {isEditing && onMoveAction && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onMoveAction('up')}
                    disabled={index === 0}
                  >
                    <ChevronUp className="h-4 w-4" />
                    <span className="sr-only">Move up</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onMoveAction('down')}
                    disabled={index === (totalActions ?? 0) - 1}
                  >
                    <ChevronDown className="h-4 w-4" />
                    <span className="sr-only">Move down</span>
                  </Button>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Delete action"
                onClick={onDelete}
                disabled={!isEditing}
              >
                <TrashIcon className="h-5 w-5" />
                <span className="sr-only">Delete action</span>
              </Button>
            </div>
          </div>

          {renderActionConfig()}
        </div>
      </CardContent>
    </Card>
  );
}; 