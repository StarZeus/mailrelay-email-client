export interface FilterRule {
  id: number;
  name: string;
  fromPattern: string | null;
  toPattern: string | null;
  subjectPattern: string | null;
  enabled: boolean;
  operator: 'AND' | 'OR';
  actions: FilterAction[];
}

export interface FilterAction {
  id: number;
  ruleId: number;
  type: 'forward' | 'webhook' | 'kafka' | 'javascript' | 'email-relay';
  config: Record<string, any>;
  order: number;
}

export interface SortableActionProps {
  action: FilterAction;
  index: number;
  isEditing: boolean;
  onDelete: () => void;
  onChange: (action: FilterAction) => void;
  onMoveAction?: (direction: 'up' | 'down') => void;
  totalActions?: number;
  onOpenComposer?: (index: number) => void;
} 