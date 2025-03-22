'use client';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

interface PanelGroupProps {
  list: React.ReactNode;
  detail: React.ReactNode;
}

export const PanelGroup = ({ list, detail }: PanelGroupProps) => {
  return (
    <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-4rem)] rounded-lg border">
      <ResizablePanel defaultSize={35}>
        <div className="flex h-full flex-col overflow-auto">
          {list}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={65}>
        <div className="flex h-full flex-col overflow-auto">
          {detail}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}; 