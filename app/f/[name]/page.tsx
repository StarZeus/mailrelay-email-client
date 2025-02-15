import { ThreadHeader, ThreadList } from '@/app/components/thread-list';
import { getThreadsForFolder, getEmailsForThread } from '@/lib/db/queries';
import { Suspense } from 'react';
import { ThreadDetails } from '@/app/components/thread-details';

export function generateStaticParams() {
  const folderNames = [
    'inbox',
    'starred',
    'drafts',
    'sent',
    'archive',
    'trash',
  ];

  return folderNames.map((name) => ({ name }));
}

export default function ThreadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ q?: string; id?: string }>;
}) {
  return (
    <div className="flex h-screen w-full">
      <Suspense fallback={<ThreadsSkeleton folderName="" />}>
        <div className="w-full">
          <Threads params={params} searchParams={searchParams} />
        </div>
      </Suspense>
    </div>
  );
}

function ThreadsSkeleton({ folderName }: { folderName: string }) {
  return (
    <div className="flex-grow border-r border-gray-200 overflow-hidden w-full">
      <ThreadHeader folderName={folderName} />
    </div>
  );
}

async function Threads({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ q?: string; id?: string }>;
}) {
  let { name } = await params;
  let { q, id } = await searchParams;
  let threads = await getThreadsForFolder(name);
  let selectedThread = id ? await getEmailsForThread(id) : null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 overflow-hidden">
        <ThreadList 
          folderName={name} 
          threads={threads} 
          searchQuery={q}
          selectedId={id}
          selectedThread={selectedThread}
        />
      </div>
    </div>
  );
}
