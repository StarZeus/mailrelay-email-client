'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils/string';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, FileStack, Home, Inbox, Search, Settings, Mail, MailCheck, LogOut, User } from "lucide-react"
import { useSession, signOut } from "next-auth/react";

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
    SidebarFooter,
    useSidebar,
} from "@/components/ui/sidebar"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function AppSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { collapsed } = useSidebar();
    const isOIDCEnabled = process.env.OIDC_AUTH_ENABLED === 'true';

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
                                className={cn(
                                  'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900',
                                  pathname === item.href ? 'bg-gray-100 text-gray-900' : ''
                                )}
                              >
                                {item.icon}
                                <span className="text-sm font-medium">{item.label}</span>
                              </Link>
                            ))}
                        </nav>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t">
                {isOIDCEnabled && session?.user && (
                    <div className="flex items-center gap-3 px-3 py-2">
                        {session.user.image ? (
                            <img
                                src={session.user.image}
                                alt={session.user.name || "User"}
                                className="h-8 w-8 rounded-full"
                            />
                        ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                                <User className="h-4 w-4 text-gray-500" />
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                                {session.user.name}
                            </span>
                            <span className="text-xs text-gray-500">
                                {session.user.email}
                            </span>
                        </div>
                        <button
                            onClick={() => signOut()}
                            className="ml-auto flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="sr-only">Sign out</span>
                        </button>
                    </div>
                )}
            </SidebarFooter>
        </Sidebar>
    );
}
