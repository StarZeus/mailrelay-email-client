'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useFilters } from '@/hooks/useFilters';
import { useSearchParams } from 'next/navigation';
import { parseEmail } from '@/lib/utils/string';
import { ClientWrapper } from '@/app/components/client-wrapper';
import { PanelGroup } from '../components/panel-group';
import { SelectionProvider } from '../context/SelectionContext';
import { FilterList } from './components/FilterList';
import { FilterDetails } from './components/FilterDetails';
import { FilterRule, FilterAction, EmailData } from './types';

export default function FiltersPage() {
  const { loading, error } = useFilters();

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

    return (
      <ClientWrapper>
        <SelectionProvider<FilterAction>>
          <PanelGroup
            list={<FilterList/>}
            detail={<FilterDetails/>}
          />
        </SelectionProvider>
      </ClientWrapper>
    );
}