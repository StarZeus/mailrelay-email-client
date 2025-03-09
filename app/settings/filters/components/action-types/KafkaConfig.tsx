'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SortableActionProps } from '../../types';

type KafkaConfigProps = Pick<SortableActionProps, 'action' | 'isEditing' | 'onChange'>;

export const KafkaConfig = ({ action, isEditing, onChange }: KafkaConfigProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label>Topic</Label>
        <Input
          value={action.config.topic || ''}
          onChange={(e) => {
            onChange({
              ...action,
              config: {
                ...action.config,
                topic: e.target.value,
              },
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
            onChange({
              ...action,
              config: {
                ...action.config,
                brokers: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            });
          }}
          disabled={!isEditing}
        />
      </div>
    </div>
  );
}; 