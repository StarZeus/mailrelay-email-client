'use client';

import { NavMenu } from './menu';
import { Toaster } from '@/components/ui/toaster';
import { Header } from './header';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation */}
        <div className="w-64 border-r border-gray-200 bg-gray-50">
          <NavMenu />
        </div>

        {/* Main Content Area */}
        {children}
      </div>
      <Toaster />
    </div>
  );
} 