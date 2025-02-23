'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, FileStack, Home, Inbox, Search, Settings, Mail, MailCheck } from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
    useSidebar,
} from "@/components/ui/sidebar"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function AppSidebar() {
    const pathname = usePathname();

    const {
        state,
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        isMobile,
        toggleSidebar,
    } = useSidebar();

    return (
        <Sidebar>
            <SidebarHeader>
                <div className="flex items-center group cursor-pointer px-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg transform transition-all group-hover:scale-105">
                        <Mail className="w-6 h-6" />
                    </div>
                    <div className="ml-3 flex flex-col">
                        <div className="flex items-baseline">
                            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                MailRelay
                            </span>
                            <span className="ml-2 text-[10px] font-medium uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                Client
                            </span>
                        </div>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <nav className="flex flex-col">
                            {[
                              {
                                href: '/inbox',
                                icon: <Inbox size={20} />,
                                label: 'Inbox'
                              },
                              {
                                href: '/processed', 
                                icon: <MailCheck size={20} />,
                                label: 'Processed'
                              },
                              {
                                href: '/settings/filters',
                                icon: <Settings size={20} />,
                                label: 'Filters & Actions'
                              }
                            ].map(item => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center space-x-1 px-6 py-4 rounded ${
                                  pathname === item.href
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {item.icon}
                                <span className="pl-2">{item.label}</span>
                              </Link>
                            ))}
                        </nav>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
