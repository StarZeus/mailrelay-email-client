import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster as SonnerToaster } from 'sonner';
import { Toaster } from '@/components/ui/toaster';
import { NavMenu } from '@/app/components/menu';
import { Header } from '@/app/components/header';
import { Sidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './components/nav-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import { AuthProvider } from './components/providers/session-provider';
import { Suspense } from 'react';
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MailRelay SMTP Server',
  description: 'An email client template using the Next.js App Router.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en" className={`bg-white text-gray-800 ${inter.className}`}>
      <body className="flex h-screen" suppressHydrationWarning>
          <AuthProvider>
            <div className="flex flex-col h-full flex-1">
                <SidebarProvider>
                  <AppSidebar />
                </SidebarProvider>
            </div>
            <div className="flex flex-col w-full">
              <Header />
                <main className="flex-1 overflow-auto">
                  {children}
                </main>
            </div>
            <Toaster />
            <SonnerToaster position="bottom-left" />
          </AuthProvider>
      </body>
    </html>
  );
}
