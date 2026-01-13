import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Eye, MoreHorizontal, Package } from 'lucide-react';
import { formatPrice, formatDate, getOrderStatusInfo, getPaymentStatusInfo } from '@/lib/formatters';
import { Order, OrderStatus, PaymentStatus } from '@/types/database';

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

async function getOrders(status?: OrderStatus, paymentStatus?: PaymentStatus) {
    const supabase = await createClient();

    let query = supabase
        .from('orders')
        .select(`
      *,
      profiles:user_id (
        full_name,
        email
      ),
      order_items (
        id,
        quantity
      )
    `)
        .order('created_at', { ascending: false })
        .limit(50);

    if (status) {
        query = query.eq('status', status);
    }

    if (paymentStatus) {
        query = query.eq('payment_status', paymentStatus);
    }

    const { data: orders, error } = await query;

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    return orders as OrderWithProfile[];
}

async function getOrderStats() {
    const supabase = await createClient();

    const { data: orders } = await supabase
        .from('orders')
        .select('status, payment_status');

    const stats = {
        total: orders?.length || 0,
        pending: orders?.filter(o => o.status === 'pending').length || 0,
        confirmed: orders?.filter(o => o.status === 'confirmed').length || 0,
        processing: orders?.filter(o => o.status === 'processing').length || 0,
        shipped: orders?.filter(o => o.status === 'shipped').length || 0,
        delivered: orders?.filter(o => o.status === 'delivered').length || 0,
        unpaid: orders?.filter(o => o.payment_status === 'pending').length || 0,
    };

    return stats;
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

async function OrdersTable({ status, paymentStatus }: { status?: OrderStatus; paymentStatus?: PaymentStatus }) {
    const orders = await getOrders(status, paymentStatus);

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
                    {orders.length > 0 ? (
                        orders.map((order) => {
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
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/orders/${order.id}`}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Lihat Detail
                                                    </Link>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={8} className="h-24 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Package className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-muted-foreground">Belum ada pesanan</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

async function StatsCards() {
    const stats = await getOrderStats();

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

export default function OrdersPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pesanan</h1>
                    <p className="text-muted-foreground">
                        Kelola semua pesanan pelanggan
                    </p>
                </div>
            </div>

            <Suspense fallback={
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
            }>
                <StatsCards />
            </Suspense>

            <Suspense fallback={<OrdersTableSkeleton />}>
                <OrdersTable />
            </Suspense>
        </div>
    );
}
