'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SortableActionProps } from '../../types';

type ForwardConfigProps = Pick<SortableActionProps, 'action' | 'isEditing' | 'onChange'>;

export const ForwardConfig = ({ action, isEditing, onChange }: ForwardConfigProps) => {
  return (
    <div>
      <Label>Forward To</Label>
      <Input
        value={action.config.forwardTo || ''}
        onChange={(e) => {
          onChange({
            ...action,
            config: {
              ...action.config,
              forwardTo: e.target.value,
            },
          });
        }}
        disabled={!isEditing}
      />
    </div>
  );
}; 