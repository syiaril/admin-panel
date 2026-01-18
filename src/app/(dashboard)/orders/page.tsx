'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
                            {['No. Order', 'Pelanggan', 'Items', 'Total', 'Status', 'Pembayaran', 'Tanggal', ''].map((h, i) => (
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
                                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
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
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-6">
            {[...Array(6)].map((_, i) => (
                <Card key={i}>
                    <CardContent className="pt-4">
                        <Skeleton className="h-8 w-12 mb-1" />
                        <Skeleton className="h-3 w-20" />
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function StatsCards({ stats }: { stats: OrderStats }) {
    return (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-6">
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">Total Pesanan</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <p className="text-xs text-muted-foreground">Menunggu</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-blue-600">{stats.confirmed}</div>
                    <p className="text-xs text-muted-foreground">Dikonfirmasi</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-indigo-600">{stats.processing}</div>
                    <p className="text-xs text-muted-foreground">Diproses</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-purple-600">{stats.shipped}</div>
                    <p className="text-xs text-muted-foreground">Dikirim</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-red-600">{stats.unpaid}</div>
                    <p className="text-xs text-muted-foreground">Belum Bayar</p>
                </CardContent>
            </Card>
        </div>
    );
}

function OrdersTable({ orders }: { orders: OrderWithProfile[] }) {
    if (orders.length === 0) {
        return (
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No. Order</TableHead>
                            <TableHead>Pelanggan</TableHead>
                            <TableHead className="text-center">Items</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Pembayaran</TableHead>
                            <TableHead>Tanggal</TableHead>
                            <TableHead className="w-10"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Package className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-muted-foreground">Belum ada pesanan</p>
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
                        <TableHead>No. Order</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead className="text-center">Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pembayaran</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="w-10"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orders.map((order) => {
                        const statusInfo = getOrderStatusInfo(order.status);
                        const paymentInfo = getPaymentStatusInfo(order.payment_status);
                        const totalItems = order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

                        return (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/orders/${order.id}`} className="hover:underline text-orange-600">
                                        {order.order_number}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <p className="font-medium">{order.profiles?.full_name || 'Guest'}</p>
                                        <p className="text-xs text-muted-foreground">{order.profiles?.email}</p>
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline">{totalItems} item</Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatPrice(order.total_amount)}
                                </TableCell>
                                <TableCell>
                                    <Badge className={statusInfo.bgColor}>{statusInfo.label}</Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge className={paymentInfo.bgColor}>{paymentInfo.label}</Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDate(order.created_at)}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon" asChild>
                                        <Link href={`/orders/${order.id}`}>
                                            <Eye className="h-4 w-4" />
                                            <span className="sr-only">Lihat Detail</span>
                                        </Link>
                                    </Button>
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
    const [orders, setOrders] = useState<OrderWithProfile[]>([]);
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Fetch orders and stats in parallel
            const [ordersResponse, statsResponse] = await Promise.all([
                fetchWithAuth('/admin/orders?limit=50'),
                fetchWithAuth('/admin/orders/stats'),
            ]);

            if (ordersResponse.success) {
                setOrders(ordersResponse.data || []);
            } else {
                throw new Error(ordersResponse.error || 'Failed to fetch orders');
            }

            if (statsResponse.success) {
                setStats(statsResponse.data);
            }
        } catch (err) {
            console.error('Error fetching orders:', err);
            setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pesanan</h1>
                    <p className="text-muted-foreground">
                        Kelola semua pesanan pelanggan
                    </p>
                </div>
                <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {isLoading ? (
                <>
                    <StatsCardsSkeleton />
                    <OrdersTableSkeleton />
                </>
            ) : (
                <>
                    {stats && <StatsCards stats={stats} />}
                    <OrdersTable orders={orders} />
                </>
            )}
        </div>
    );
}
