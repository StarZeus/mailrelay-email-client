'use client';

import { ClientWrapper } from '@/app/components/client-wrapper';
import { EmailList } from '@/app/components/EmailList';
import { EmailDetails } from '../components/EmailDetails';
import { PanelGroup } from '../components/panel-group';
import { SelectionProvider } from '../context/SelectionContext';
import type { Email } from '@/types/common';

export default function InboxPage() {
  return (
    <ClientWrapper>
      <SelectionProvider<Email>>
        <PanelGroup
          list={<EmailList />}
          detail={<EmailDetails />}
        />
      </SelectionProvider>
    </ClientWrapper>
  );
} 