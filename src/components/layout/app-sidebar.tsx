'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Star,
    Image,
    BarChart3,
    Settings,
    FolderTree,
    ChevronDown,
} from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarRail,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';

const menuItems = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Pesanan',
        url: '/orders',
        icon: ShoppingCart,
    },
    {
        title: 'Produk',
        icon: Package,
        items: [
            { title: 'Semua Produk', url: '/products' },
            { title: 'Tambah Produk', url: '/products/new' },
        ],
    },
    {
        title: 'Kategori',
        url: '/categories',
        icon: FolderTree,
    },
    {
        title: 'Pelanggan',
        url: '/customers',
        icon: Users,
    },
    {
        title: 'Ulasan',
        url: '/reviews',
        icon: Star,
    },
    {
        title: 'Banner',
        url: '/banners',
        icon: Image,
    },
    {
        title: 'Laporan',
        url: '/reports',
        icon: BarChart3,
    },
    {
        title: 'Pengaturan',
        url: '/settings',
        icon: Settings,
    },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="border-b border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="hover:bg-transparent"
                        >
                            <Link href="/dashboard">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-orange-500 text-white font-bold">
                                    KS
                                </div>
                                <div className="flex flex-col gap-0.5 leading-none">
                                    <span className="font-semibold text-orange-600">Kedai Species</span>
                                    <span className="text-xs text-muted-foreground">Admin Panel</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarMenu className="p-2">
                    {menuItems.map((item) => (
                        <React.Fragment key={item.title}>
                            {item.items ? (
                                <Collapsible
                                    defaultOpen={item.items.some((subItem) =>
                                        pathname.startsWith(subItem.url)
                                    )}
                                    className="group/collapsible"
                                >
                                    <SidebarMenuItem>
                                        <CollapsibleTrigger asChild>
                                            <SidebarMenuButton
                                                tooltip={item.title}
                                                className={
                                                    item.items.some((subItem) =>
                                                        pathname.startsWith(subItem.url)
                                                    )
                                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                                        : ''
                                                }
                                            >
                                                {item.icon && <item.icon className="size-4" />}
                                                <span>{item.title}</span>
                                                <ChevronDown className="ml-auto size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                                            </SidebarMenuButton>
                                        </CollapsibleTrigger>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                {item.items.map((subItem) => (
                                                    <SidebarMenuSubItem key={subItem.url}>
                                                        <SidebarMenuSubButton
                                                            asChild
                                                            isActive={pathname === subItem.url}
                                                        >
                                                            <Link href={subItem.url}>{subItem.title}</Link>
                                                        </SidebarMenuSubButton>
                                                    </SidebarMenuSubItem>
                                                ))}
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            ) : (
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        tooltip={item.title}
                                        isActive={pathname === item.url || (item.url !== '/dashboard' && pathname.startsWith(item.url))}
                                    >
                                        <Link href={item.url}>
                                            {item.icon && <item.icon className="size-4" />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </React.Fragment>
                    ))}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="sm" className="text-xs text-muted-foreground">
                            <span>© 2024 Kedai Species</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
