import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { NavMenu } from '@/app/components/menu';
import { Header } from '@/app/components/header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MailRelay SMTP Server',
  description: 'An email client template using the Next.js App Router.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`bg-white text-gray-800 ${inter.className}`}>
      <body className="flex h-screen" suppressHydrationWarning>
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
        </div>
        <Toaster />
      </body>
    </html>
  );
}
