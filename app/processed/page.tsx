'use client';

import { ClientWrapper } from '@/app/components/client-wrapper';
import { SelectionProvider } from '../context/SelectionContext';
import { EmailDetails } from '../components/EmailDetails';
import { ProcessedEmailList } from '../components/ProcessedEmailList';
import { ProcessedEmail } from '@/types/common';
import { PanelGroup } from '../components/panel-group';

export default function ProcessedPage() {
  return (
    <ClientWrapper>
      <SelectionProvider<ProcessedEmail>>
        <PanelGroup
          list={<ProcessedEmailList />}
          detail={<EmailDetails />}
        />
      </SelectionProvider>
    </ClientWrapper>
  );
}