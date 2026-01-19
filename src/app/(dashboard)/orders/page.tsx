'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Added useRouter import
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, MoreHorizontal, Package, RefreshCw, AlertCircle } from 'lucide-react';
import { formatPrice, formatDate, getOrderStatusInfo, getPaymentStatusInfo } from '@/lib/formatters';
import { Order, OrderStatus, PaymentStatus } from '@/types/database';
import { fetchWithAuth } from '@/hooks/lib/api';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Pagination } from '@/components/ui/pagination';
import { useLanguage } from '@/components/layout/language-provider';

const ITEMS_PER_PAGE = 10;

interface OrderWithProfile extends Order {
    profiles: {
        full_name: string | null;
        email: string;
    } | null;
    order_items: {
        id: string;
        quantity: number;
    }[];
}

interface OrderStats {
    total: number;
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    unpaid: number;
}

function OrdersTableSkeleton() {
    const { t } = useLanguage();
    const skeletonHeaders = [
        t('orderNumber'),
        t('customer'),
        t('items'),
        t('total'),
        t('status'),
        t('payment'),
        t('date'),
    ];

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-9 w-24" />
                ))}
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {skeletonHeaders.map((h, i) => (
                                <TableHead key={i}>{h}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {[...Array(5)].map((_, i) => (
                            <TableRow key={i}>
                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function StatsCardsSkeleton() {
    return (
        <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6 mb-4">
            {[...Array(6)].map((_, i) => (
                <Card key={i} className="py-2 gap-0">
                    <CardContent className="p-0 text-center">
                        <Skeleton className="h-8 w-12 mx-auto mb-1" />
                        <Skeleton className="h-3 w-16 mx-auto" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function StatsCards({ stats }: { stats: OrderStats }) {
    const { t } = useLanguage();
    return (
        <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6 mb-4">
            <Card className="py-2 gap-0">
                <CardContent className="p-0 text-center">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-[10px] uppercase font-medium text-muted-foreground">Total</p>
                </CardContent>
            </Card>
            <Card className="py-2 gap-0">
                <CardContent className="p-0 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <p className="text-[10px] uppercase font-medium text-muted-foreground">{t('status_pending')}</p>
                </CardContent>
            </Card>
            <Card className="py-2 gap-0">
                <CardContent className="p-0 text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
                    <p className="text-[10px] uppercase font-medium text-muted-foreground">{t('status_confirmed')}</p>
                </CardContent>
            </Card>
            <Card className="py-2 gap-0">
                <CardContent className="p-0 text-center">
                    <div className="text-2xl font-bold text-indigo-600">{stats.processing}</div>
                    <p className="text-[10px] uppercase font-medium text-muted-foreground">{t('status_processing')}</p>
                </CardContent>
            </Card>
            <Card className="py-2 gap-0">
                <CardContent className="p-0 text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
                    <p className="text-[10px] uppercase font-medium text-muted-foreground">{t('status_shipped')}</p>
                </CardContent>
            </Card>
            <Card className="py-2 gap-0">
                <CardContent className="p-0 text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.unpaid}</div>
                    <p className="text-[10px] uppercase font-medium text-muted-foreground">{t('payment_pending')}</p>
                </CardContent>
            </Card>
        </div>
    );
}

function OrdersTable({ orders }: { orders: OrderWithProfile[] }) {
    const { language, t } = useLanguage();
    const router = useRouter();

    const headers = [
        { label: t('orderNumber'), className: "" },
        { label: t('customer'), className: "" },
        { label: t('items'), className: "text-center" },
        { label: t('total'), className: "text-right" },
        { label: t('status'), className: "" },
        { label: t('payment'), className: "" },
        { label: t('date'), className: "" },
    ];

    if (orders.length === 0) {
        return (
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {headers.map((h, i) => (
                                <TableHead key={i} className={h.className}>{h.label}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={headers.length} className="h-24 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Package className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-muted-foreground">{t('noOrdersFound')}</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        );
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        {headers.map((h, i) => (
                            <TableHead key={i} className={h.className}>{h.label}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => {
                        const statusInfo = getOrderStatusInfo(order.status, t);
                        const paymentInfo = getPaymentStatusInfo(order.payment_status, t);
                        const totalItems = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

                        return (
                            <TableRow
                                key={order.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => router.push(`/orders/${order.id}`)}
                            >
                                <TableCell className="font-medium text-orange-600">
                                    {order.order_number}
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{order.profiles?.full_name || t('guest')}</p>
                                        <p className="text-xs text-muted-foreground">{order.profiles?.email}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center font-medium text-muted-foreground">
                                    {totalItems}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatPrice(order.total_amount, language)}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={statusInfo.color as any} className={statusInfo.bgColor}>{statusInfo.label}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={paymentInfo.color as any} className={paymentInfo.bgColor}>{paymentInfo.label}</Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDate(order.created_at, language)}
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}

export default function OrdersPage() {
    const { t } = useLanguage();
    const [orders, setOrders] = useState<OrderWithProfile[]>([]);
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [totalItems, setTotalItems] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const pageFromUrl = searchParams ? Number(searchParams.get('page')) || 1 : 1;

    useEffect(() => {
        setCurrentPage(pageFromUrl);
    }, [pageFromUrl]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const limit = ITEMS_PER_PAGE;
            const offset = (currentPage - 1) * limit;

            // Fetch orders and stats in parallel
            const [ordersResponse, statsResponse] = await Promise.all([
                fetchWithAuth(`/admin/orders?limit=${limit}&offset=${offset}`),
                fetchWithAuth('/admin/orders/stats'),
            ]);

            if (ordersResponse.success) {
                setOrders(ordersResponse.data || []);
                setTotalItems(ordersResponse.totalCount || (ordersResponse.data?.length === limit ? currentPage * limit + 1 : (currentPage - 1) * limit + ordersResponse.data?.length));
            } else {
                throw new Error(ordersResponse.error || 'Failed to fetch orders');
            }

            if (statsResponse.success) {
                setStats(statsResponse.data);
                if (statsResponse.data?.total) {
                    setTotalItems(statsResponse.data.total);
                }
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(err instanceof Error ? err.message : t('errorFetchingData' as any) || 'Terjadi kesalahan saat mengambil data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentPage]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('orders')}</h1>
                </div>
                <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {t('refresh')}
                </Button>
            </div>

            {
                error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )
            }

            {
                isLoading ? (
                    <>
                        <StatsCardsSkeleton />
                        <OrdersTableSkeleton />
                    </>
                ) : (
                    <>
                        {stats && <StatsCards stats={stats} />}
                        <OrdersTable orders={orders} />
                        <Pagination
                            totalCount={totalItems}
                            pageSize={ITEMS_PER_PAGE}
                            currentPage={currentPage}
                        />
                    </>
                )
            }
        </div >
    );
}
