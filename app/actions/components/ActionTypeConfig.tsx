'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SortableActionProps } from '../types';
import { ForwardConfig } from './action-types/ForwardConfig';
import { WebhookConfig } from './action-types/WebhookConfig';
import { KafkaConfig } from './action-types/KafkaConfig';
import { JavaScriptConfig } from './action-types/JavaScriptConfig';
import { EmailRelayConfig } from './action-types/EmailRelayConfig';

type ActionTypeConfigProps = Pick<SortableActionProps, 'action' | 'index' | 'isEditing' | 'onChange'>;

export const ActionTypeConfig = ({ action, index, isEditing, onChange }: ActionTypeConfigProps) => {
  const configs = {
    forward: ForwardConfig,
    webhook: WebhookConfig,
    kafka: KafkaConfig,
    javascript: JavaScriptConfig,
    'email-relay': EmailRelayConfig
  };

  const ConfigComponent = configs[action.type];

  if (!ConfigComponent) {
    return null;
  }

  return (
    <ConfigComponent
      action={action}
      index={index}
      isEditing={isEditing}
      onChange={onChange}
    />
  );
}; 