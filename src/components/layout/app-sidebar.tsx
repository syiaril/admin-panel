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
    Moon,
    Sun,
    LogOut,
    User as UserIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';

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
    SidebarTrigger,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from './language-provider';

interface MenuItem {
    titleKey: any; // Type TranslationKey would be better but keeping it simple for now
    url: string;
    icon?: React.ElementType;
    items?: {
        titleKey: any;
        url: string;
    }[];
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    user?: {
        email: string;
        full_name: string | null;
        avatar_url: string | null;
    };
}

const menuItems: MenuItem[] = [
    {
        titleKey: 'dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        titleKey: 'orders',
        url: '/orders',
        icon: ShoppingCart,
    },
    {
        titleKey: 'products',
        url: '/products',
        icon: Package,
    },
    {
        titleKey: 'categories',
        url: '/categories',
        icon: FolderTree,
    },
    {
        titleKey: 'customers',
        url: '/customers',
        icon: Users,
    },
    {
        titleKey: 'reviews',
        url: '/reviews',
        icon: Star,
    },
    {
        titleKey: 'banners',
        url: '/banners',
        icon: Image,
    },
    {
        titleKey: 'reports',
        url: '/reports',
        icon: BarChart3,
    },
    {
        titleKey: 'settings',
        url: '/settings',
        icon: Settings,
    },
];

export function AppSidebar({ user, ...props }: AppSidebarProps) {
    const pathname = usePathname();
    const { language, setLanguage, t } = useLanguage();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    const getInitials = (name: string | null, email: string) => {
        if (name) {
            return name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        return email.slice(0, 2).toUpperCase();
    };

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader className="border-b border-sidebar-border p-2">
                <SidebarMenu>
                    <SidebarMenuItem className="flex items-center group-data-[collapsible=icon]:justify-center">
                        <div className="flex flex-1 items-center gap-2 overflow-hidden transition-all duration-300 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-orange-500 text-white font-bold shrink-0">
                                KS
                            </div>
                            <div className="flex flex-col leading-none transition-all duration-300">
                                <span className="font-semibold text-orange-600 truncate">Kedai Species</span>
                            </div>
                        </div>
                        <SidebarTrigger className="h-8 w-8 shrink-0 transition-transform duration-300 group-data-[collapsible=icon]:size-8 group-data-[collapsible=expanded]:ml-2" />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <SidebarMenu className="p-2">
                    {menuItems.map((item) => (
                        <React.Fragment key={item.titleKey}>
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
                                                tooltip={t(item.titleKey)}
                                                className={
                                                    item.items.some((subItem) =>
                                                        pathname.startsWith(subItem.url)
                                                    )
                                                        ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                                                        : ''
                                                }
                                            >
                                                {item.icon && <item.icon className="size-4" />}
                                                <span>{t(item.titleKey)}</span>
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
                                                            <Link href={subItem.url}>{t(subItem.titleKey)}</Link>
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
                                        tooltip={t(item.titleKey)}
                                        isActive={pathname === item.url || (item.url !== '/dashboard' && pathname.startsWith(item.url))}
                                    >
                                        <Link href={item.url}>
                                            {item.icon && <item.icon className="size-4" />}
                                            <span>{t(item.titleKey)}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )}
                        </React.Fragment>
                    ))}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip={t('language')}
                            onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
                            className="transition-all duration-300 group-data-[collapsible=icon]:justify-center"
                        >
                            <Languages className="size-4 shrink-0 transition-transform duration-500" />
                            <span className="transition-all duration-300 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:hidden overflow-hidden whitespace-nowrap ml-2">
                                {t('language')}: {language === 'id' ? 'ID' : 'EN'}
                            </span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <SidebarMenuButton
                            tooltip={t('theme')}
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="transition-all duration-300 group-data-[collapsible=icon]:justify-center"
                        >
                            {mounted ? (
                                <>
                                    <div className="relative size-4 shrink-0 transition-transform duration-500">
                                        <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                        <Moon className="absolute inset-0 size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                    </div>
                                    <span className="transition-all duration-300 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:hidden overflow-hidden whitespace-nowrap ml-2">
                                        {t('theme')}: {theme === 'dark' ? t('dark') : t('light')}
                                    </span>
                                </>
                            ) : (
                                <>
                                    <div className="size-4 shrink-0" />
                                    <span className="opacity-50 ml-2 group-data-[collapsible=icon]:hidden">{t('loading')}</span>
                                </>
                            )}
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        {mounted && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton tooltip={t('profile')} className="h-10 transition-all duration-300 group-data-[collapsible=icon]:justify-center">
                                        <Avatar className="size-6 shrink-0 transition-transform duration-300">
                                            <AvatarImage
                                                src={user?.avatar_url || undefined}
                                                alt={user?.full_name || 'Admin'}
                                            />
                                            <AvatarFallback className="bg-orange-500 text-[8px] text-white">
                                                {getInitials(user?.full_name || null, user?.email || 'AD')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="transition-all duration-300 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:hidden overflow-hidden whitespace-nowrap ml-2">
                                            {user?.full_name || 'Admin'}
                                        </span>
                                        <ChevronDown className="ml-auto size-4 transition-all duration-300 group-data-[collapsible=icon]:hidden" />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="start" side="right" forceMount>
                                    <DropdownMenuLabel className="font-normal">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {user?.full_name || 'Admin'}
                                            </p>
                                            <p className="text-xs leading-none text-muted-foreground truncate">
                                                {user?.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        <span>{t('profile')}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>{t('logout')}</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                        <div className="px-2 py-1.5 text-[10px] text-muted-foreground transition-all duration-300 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:h-0 overflow-hidden">
                            © 2024 Kedai Species
                        </div>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
