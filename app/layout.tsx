import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster as SonnerToaster } from 'sonner';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/app/components/header';
import { AppSidebar } from './components/nav-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AuthProvider } from './components/providers/session-provider';
import { Suspense } from 'react';
import { BasePathProvider } from './components/providers/basepath-provider';
import getConfig from 'next/config';

const inter = Inter({ subsets: ['latin'] });
const { publicRuntimeConfig } = getConfig();

export const metadata: Metadata = {
  title: 'MailRelay SMTP Server',
  description: 'An email client template using the Next.js App Router.',
  icons: {
    icon: [
      {
        url: `${publicRuntimeConfig.basePath}/favicon.ico`,
        sizes: 'any',
      },
    ],
    apple: [
      {
        url: `${publicRuntimeConfig.basePath}/apple-touch-icon.png`,
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`bg-white text-gray-800 ${inter.className}`}>
      <body className="flex h-screen overflow-hidden" suppressHydrationWarning>
        <AuthProvider>
          <BasePathProvider config={publicRuntimeConfig}>
            <div className="flex h-full w-64 flex-shrink-0">
              <SidebarProvider>
                <AppSidebar />
              </SidebarProvider>
            </div>
            <div className="flex flex-col flex-1">
              <Header />
              <main className="flex-1 overflow-hidden">
                {children}
              </main>
            </div>
            <Toaster />
            <SonnerToaster position="bottom-left" />
          </BasePathProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
