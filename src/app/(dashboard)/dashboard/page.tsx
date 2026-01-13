// @ts-nocheck
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
    DollarSign,
    ShoppingCart,
    Package,
    Users,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
} from 'lucide-react';
import { formatPrice, formatRelativeTime, getOrderStatusInfo } from '@/lib/formatters';
import { Order, Product } from '@/types/database';
import Link from 'next/link';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { OrderStatusChart } from '@/components/dashboard/order-status-chart';
import { TopProductsChart } from '@/components/dashboard/top-products-chart';

async function getDashboardStats() {
    const supabase = await createClient();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get orders this month
    const { data: ordersThisMonth } = await supabase
        .from('orders')
        .select('total_amount, status')
        .gte('created_at', startOfMonth.toISOString());

    // Get orders last month
    const { data: ordersLastMonth } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', startOfLastMonth.toISOString())
        .lte('created_at', endOfLastMonth.toISOString());

    // Get products count
    const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

    const { count: activeProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    const { data: outOfStockProducts } = await supabase
        .from('products')
        .select('id')
        .eq('stock', 0);

    // Get customers
    const { count: totalCustomers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');

    const { count: newCustomersThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer')
        .gte('created_at', startOfMonth.toISOString());

    // Calculate revenue
    const revenueThisMonth = ordersThisMonth
        ?.filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

    const revenueLastMonth = ordersLastMonth
        ?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

    const revenueChange = revenueLastMonth > 0
        ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
        : 0;

    const pendingOrders = ordersThisMonth?.filter(o => o.status === 'pending').length || 0;

    return {
        totalRevenue: revenueThisMonth,
        revenueChange,
        totalOrders: ordersThisMonth?.length || 0,
        pendingOrders,
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        outOfStockProducts: outOfStockProducts?.length || 0,
        totalCustomers: totalCustomers || 0,
        newCustomersThisMonth: newCustomersThisMonth || 0,
    };
}

async function getRecentOrders() {
    const supabase = await createClient();

    const { data: orders } = await supabase
        .from('orders')
        .select(`
      id,
      order_number,
      total_amount,
      status,
      created_at,
      profiles:user_id (
        full_name,
        email
      )
    `)
        .order('created_at', { ascending: false })
        .limit(5);

    return orders as (Order & { profiles: { full_name: string | null; email: string } | null })[];
}

async function getLowStockProducts() {
    const supabase = await createClient();

    const { data: products } = await supabase
        .from('products')
        .select(`
      id,
      name,
      sku,
      stock,
      low_stock_threshold,
      product_images (
        image_url
      )
    `)
        .eq('is_active', true)
        .or('stock.lte.low_stock_threshold,stock.eq.0')
        .order('stock', { ascending: true })
        .limit(5);

    return products as (Product & { product_images: { image_url: string }[] })[];
}

async function getRevenueChartData() {
    const supabase = await createClient();
    const days = 7;
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

        const { data: orders } = await supabase
            .from('orders')
            .select('total_amount')
            .gte('created_at', startOfDay.toISOString())
            .lt('created_at', endOfDay.toISOString())
            .not('status', 'in', '("cancelled","refunded")');

        const revenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
        data.push({
            date: date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            revenue,
        });
    }

    return data;
}

async function getOrderStatusData() {
    const supabase = await createClient();

    const { data: orders } = await supabase
        .from('orders')
        .select('status');

    const statusCounts = orders?.reduce((acc, o) => {
        acc[o.status] = (acc[o.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>) || {};

    const statusColors: Record<string, string> = {
        pending: '#EAB308',
        confirmed: '#3B82F6',
        processing: '#8B5CF6',
        shipped: '#6366F1',
        delivered: '#22C55E',
        completed: '#10B981',
        cancelled: '#EF4444',
        refunded: '#F97316',
    };

    return Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: statusColors[name] || '#94A3B8',
    }));
}

async function getTopProductsData() {
    const supabase = await createClient();

    const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_name, quantity');

    const productSales = orderItems?.reduce((acc, item) => {
        acc[item.product_name] = (acc[item.product_name] || 0) + item.quantity;
        return acc;
    }, {} as Record<string, number>) || {};

    return Object.entries(productSales)
        .map(([name, sold]) => ({ name, sold }))
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 5);
}

function StatCard({
    title,
    value,
    change,
    icon: Icon,
    subtitle,
}: {
    title: string;
    value: string;
    change?: number;
    icon: React.ElementType;
    subtitle?: string;
}) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {change !== undefined && (
                    <p className={`text-xs flex items-center gap-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {change >= 0 ? '+' : ''}{change.toFixed(1)}% dari bulan lalu
                    </p>
                )}
                {subtitle && (
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
            </CardContent>
        </Card>
    );
}

function StatCardSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
            </CardContent>
        </Card>
    );
}

async function StatsSection() {
    const stats = await getDashboardStats();

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Total Pendapatan"
                value={formatPrice(stats.totalRevenue)}
                change={stats.revenueChange}
                icon={DollarSign}
            />
            <StatCard
                title="Pesanan Bulan Ini"
                value={stats.totalOrders.toString()}
                icon={ShoppingCart}
                subtitle={`${stats.pendingOrders} pesanan menunggu`}
            />
            <StatCard
                title="Total Produk"
                value={stats.totalProducts.toString()}
                icon={Package}
                subtitle={`${stats.activeProducts} aktif, ${stats.outOfStockProducts} habis`}
            />
            <StatCard
                title="Pelanggan"
                value={stats.totalCustomers.toString()}
                icon={Users}
                subtitle={`+${stats.newCustomersThisMonth} baru bulan ini`}
            />
        </div>
    );
}

async function RecentOrdersSection() {
    const orders = await getRecentOrders();

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pesanan Terbaru</CardTitle>
                <Link href="/orders" className="text-sm text-orange-600 hover:underline">
                    Lihat semua
                </Link>
            </CardHeader>
            <CardContent>
                {orders && orders.length > 0 ? (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const statusInfo = getOrderStatusInfo(order.status);
                            return (
                                <Link
                                    key={order.id}
                                    href={`/orders/${order.id}`}
                                    className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg -mx-2"
                                >
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">{order.order_number}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {order.profiles?.full_name || order.profiles?.email || 'Guest'}
                                        </p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-sm font-medium">{formatPrice(order.total_amount)}</p>
                                        <Badge variant={statusInfo.color} className="text-xs">
                                            {statusInfo.label}
                                        </Badge>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Belum ada pesanan
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

async function LowStockSection() {
    const products = await getLowStockProducts();

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Stok Rendah
                </CardTitle>
                <Link href="/products?stock=low" className="text-sm text-orange-600 hover:underline">
                    Lihat semua
                </Link>
            </CardHeader>
            <CardContent>
                {products && products.length > 0 ? (
                    <div className="space-y-4">
                        {products.map((product) => (
                            <Link
                                key={product.id}
                                href={`/products/${product.id}/edit`}
                                className="flex items-center gap-3 hover:bg-muted/50 p-2 rounded-lg -mx-2"
                            >
                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                                    {product.product_images?.[0]?.image_url ? (
                                        <img
                                            src={product.product_images[0].image_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <Package className="h-5 w-5 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                                </div>
                                <Badge
                                    variant={product.stock === 0 ? 'destructive' : 'secondary'}
                                    className="shrink-0"
                                >
                                    {product.stock === 0 ? 'Habis' : `Sisa ${product.stock}`}
                                </Badge>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Semua produk stok aman 👍
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

async function ChartsSection() {
    const [revenueData, orderStatusData, topProductsData] = await Promise.all([
        getRevenueChartData(),
        getOrderStatusData(),
        getTopProductsData(),
    ]);

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <RevenueChart data={revenueData} />
            </div>
            <OrderStatusChart data={orderStatusData} />
            <div className="lg:col-span-2">
                <TopProductsChart data={topProductsData} />
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Selamat datang di Admin Panel Kedai Species
                </p>
            </div>

            <Suspense fallback={
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </div>
            }>
                <StatsSection />
            </Suspense>

            <div className="grid gap-6 md:grid-cols-2">
                <Suspense fallback={
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex justify-between">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                }>
                    <RecentOrdersSection />
                </Suspense>

                <Suspense fallback={
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded" />
                                    <div className="flex-1">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-3 w-16 mt-1" />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                }>
                    <LowStockSection />
                </Suspense>
            </div>

            {/* Charts Section */}
            <Suspense fallback={
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                            <CardContent><Skeleton className="h-[300px]" /></CardContent>
                        </Card>
                    </div>
                    <Card>
                        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent><Skeleton className="h-[300px]" /></CardContent>
                    </Card>
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                            <CardContent><Skeleton className="h-[300px]" /></CardContent>
                        </Card>
                    </div>
                </div>
            }>
                <ChartsSection />
            </Suspense>
        </div>
    );
}
