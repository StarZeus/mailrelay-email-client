'use client';

import { ClientWrapper } from '@/app/components/client-wrapper';
import { EmailList } from '@/app/components/EmailList';

export default function InboxPage() {
  return (
    <ClientWrapper>
      <EmailList />
    </ClientWrapper>
  );
} 