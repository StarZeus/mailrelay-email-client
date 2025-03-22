import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface FilterAction {
  id: number;
  type: string;
  config: Record<string, any>;
}

interface FilterRule {
  id: number;
  name: string;
  fromPattern: string | null;
  toPattern: string | null;
  subjectPattern: string | null;
  operator: 'AND' | 'OR';
  enabled: boolean;
  actions: FilterAction[];
}

export function useFilters() {
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runningRuleId, setRunningRuleId] = useState<number | null>(null);


  const refresh = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/filter-rules');
      if (!response.ok) throw new Error('Failed to fetch rules');
      const data = await response.json();
      setFilters(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch rules';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const toggleFilter = async (id: number) => {
    try {
      const rule = filters.find(f => f.id === id);
      const response = await fetch('/api/filter-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled: !rule?.enabled })
      });
      if (!response.ok) throw new Error('Failed to toggle rule');
      refresh();
    } catch (error) {
      toast.error('Failed to toggle filter rule');
    }
  };

  const deleteFilter = async (id: number) => {
    try {
      const response = await fetch(`/api/filter-rules?id=${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete rule');
      refresh();
    } catch (error) {
      toast.error('Failed to delete filter rule');
    }
  };

  const runRule = async (id: number) => {
    try {
      setRunningRuleId(id);
      const response = await fetch('/api/filter-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'run', ruleId: id })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to run rule');
      }

      const result = await response.json();
      toast.success(result.message);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run rule';
      toast.error(message);
    } finally {
      setRunningRuleId(null);
    }
  };

  return {
    filters,
    loading,
    error,
    runningRuleId,
    toggleFilter,
    deleteFilter,
    runRule,
    refresh,
    editing,
    setEditing
  };
} 