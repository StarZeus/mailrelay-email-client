'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableActionProps } from '../../types';

type WebhookConfigProps = Pick<SortableActionProps, 'action' | 'isEditing' | 'onChange'>;

export const WebhookConfig = ({ action, isEditing, onChange }: WebhookConfigProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label>URL</Label>
        <Input
          value={action.config.url || ''}
          onChange={(e) => {
            onChange({
              ...action,
              config: {
                ...action.config,
                url: e.target.value,
              },
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
            onChange({
              ...action,
              config: {
                ...action.config,
                method: value,
              },
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
  );
}; 