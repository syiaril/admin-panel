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
import { formatPrice, formatRelativeTime, getOrderStatusInfo, getStockStatusInfo } from '@/lib/formatters';
import { Order, Product } from '@/types/database';
import Link from 'next/link';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { OrderStatusChart } from '@/components/dashboard/order-status-chart';
import { TopProductsChart } from '@/components/dashboard/top-products-chart';
import { cookies } from 'next/headers';
import { getTranslation, Language } from '@/lib/i18n';

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
        .from('products_low_stock')
        .select(`
      id,
      name,
      sku,
      stock,
      low_stock_threshold,
      primary_image_url
    `)
        .order('stock', { ascending: true })
        .limit(5);

    return (products?.map(p => ({
        ...p,
        product_images: p.primary_image_url ? [{ image_url: p.primary_image_url }] : []
    })) || []) as (Product & { product_images: { image_url: string }[] })[];
}

async function getRevenueChartData(period: string = '7d') {
    const supabase = await createClient();
    const now = new Date();
    let startDate = new Date();
    let groupBy: 'day' | 'week' | 'month' = 'day';

    switch (period) {
        case '1m':
            startDate.setMonth(now.getMonth() - 1);
            groupBy = 'day';
            break;
        case '3m':
            startDate.setMonth(now.getMonth() - 3);
            groupBy = 'week';
            break;
        case '1y':
            startDate.setFullYear(now.getFullYear() - 1);
            groupBy = 'month';
            break;
        case '3y':
            startDate.setFullYear(now.getFullYear() - 3);
            groupBy = 'month';
            break;
        case '7d':
        default:
            startDate.setDate(now.getDate() - 7);
            groupBy = 'day';
            break;
    }

    const { data: dbOrders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', startDate.toISOString())
        .not('status', 'in', '("cancelled","refunded")')
        .order('created_at', { ascending: true });

    const chartData: { date: string, revenue: number, rawDate: Date }[] = [];

    // Initialize data structure based on grouping
    let current = new Date(startDate);
    while (current <= now) {
        let label = '';
        if (groupBy === 'day') {
            label = current.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        } else if (groupBy === 'week') {
            // Get week number or date range
            const endOfWeek = new Date(current);
            endOfWeek.setDate(current.getDate() + 6);
            label = `${current.getDate()}/${current.getMonth() + 1}`;
        } else if (groupBy === 'month') {
            label = current.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        }

        chartData.push({
            date: label,
            revenue: 0,
            rawDate: new Date(current)
        });

        if (groupBy === 'day') current.setDate(current.getDate() + 1);
        else if (groupBy === 'week') current.setDate(current.getDate() + 7);
        else if (groupBy === 'month') current.setMonth(current.getMonth() + 1);
    }

    // Fill data
    dbOrders?.forEach(order => {
        const orderDate = new Date(order.created_at);
        const dataPoint = chartData.find((d, idx) => {
            const nextD = chartData[idx + 1];
            if (!nextD) return orderDate >= d.rawDate;
            return orderDate >= d.rawDate && orderDate < nextD.rawDate;
        });
        if (dataPoint) {
            dataPoint.revenue += order.total_amount || 0;
        }
    });

    return chartData.map(({ date, revenue }) => ({ date, revenue }));
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
        pending: '#FACC15',    // Yellow-400
        confirmed: '#60A5FA',  // Blue-400
        processing: '#A78BFA', // Violet-400
        shipped: '#818CF8',    // Indigo-400
        delivered: '#4ADE80',  // Green-400
        completed: '#2DD4BF',  // Teal-400
        cancelled: '#F87171',  // Red-400
        refunded: '#FB923C',   // Orange-400
    };

    return Object.entries(statusCounts).map(([status, value]) => ({
        name: `status_${status}`,
        value,
        color: statusColors[status] || '#94A3B8',
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
        <Card className="py-2 gap-0 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-0">
                <CardTitle className="text-[10px] uppercase font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-3 w-3 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 py-0">
                <div className="text-xl font-bold">{value}</div>
                {change !== undefined && (
                    <p className={`text-[10px] flex items-center gap-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {change >= 0 ? <TrendingUp className="h-2 w-2" /> : <TrendingDown className="h-2 w-2" />}
                        {Math.abs(change)}%
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

async function StatsSection({ t, language }: { t: any, language: string }) {
    const stats = await getDashboardStats();

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title={t('totalRevenue')}
                value={formatPrice(stats.totalRevenue, language)}
                change={stats.revenueChange}
                icon={DollarSign}
            />
            <StatCard
                title={t('ordersThisMonth')}
                value={stats.totalOrders.toString()}
                icon={ShoppingCart}
                subtitle={`${stats.pendingOrders} ${t('pendingOrders')}`}
            />
            <StatCard
                title={t('totalProducts')}
                value={stats.totalProducts.toString()}
                icon={Package}
                subtitle={`${stats.activeProducts} ${t('active')}, ${stats.outOfStockProducts} ${t('outOfStock')}`}
            />
            <StatCard
                title={t('customers')}
                value={stats.totalCustomers.toString()}
                icon={Users}
                subtitle={`+${stats.newCustomersThisMonth} ${t('newThisMonth')}`}
            />
        </div>
    );
}

async function RecentOrdersSection({ t, language }: { t: any, language: string }) {
    const orders = await getRecentOrders();

    return (
        <Card className="py-4 gap-0">
            <CardHeader className="flex flex-row items-center justify-between px-6 py-0 mb-4">
                <CardTitle className="text-base font-semibold">{t('recentOrders')}</CardTitle>
                <Link href="/orders" className="text-xs text-orange-600 hover:underline">
                    {t('viewAll')}
                </Link>
            </CardHeader>
            <CardContent className="px-6 py-0">
                {orders && orders.length > 0 ? (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const statusInfo = getOrderStatusInfo(order.status, t);
                            return (
                                <Link
                                    key={order.id}
                                    href={`/orders/${order.id}`}
                                    className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg -mx-2"
                                >
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">{order.order_number}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {order.profiles?.full_name || order.profiles?.email || t('guest')}
                                        </p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-sm font-medium">{formatPrice(order.total_amount, language)}</p>
                                        <Badge variant={statusInfo.color as any} className="text-xs">
                                            {statusInfo.label}
                                        </Badge>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        {t('noOrders')}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

async function LowStockSection({ t }: { t: any }) {
    const products = await getLowStockProducts();

    return (
        <Card className="py-4 gap-0">
            <CardHeader className="flex flex-row items-center justify-between px-6 py-0 mb-4">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    {t('lowStock')}
                </CardTitle>
                <Link href="/products?stock=low" className="text-xs text-orange-600 hover:underline">
                    {t('viewAll')}
                </Link>
            </CardHeader>
            <CardContent className="px-6 py-0">
                {products && products.length > 0 ? (
                    <div className="space-y-4">
                        {products.map((product) => {
                            const stockInfo = getStockStatusInfo(product.stock, t);
                            return (
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
                                        variant={stockInfo.color === 'warning' ? 'outline' : (stockInfo.color as any)}
                                        className={`shrink-0 ${stockInfo.bgColor}`}
                                    >
                                        {stockInfo.label} {product.stock > 0 && `(${product.stock})`}
                                    </Badge>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        {t('safeStock')}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

async function ChartsSection({ period }: { period: string }) {
    const [revenueData, orderStatusData, topProductsData] = await Promise.all([
        getRevenueChartData(period),
        getOrderStatusData(),
        getTopProductsData(),
    ]);

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
                <RevenueChart data={revenueData} period={period} />
            </div>
            <OrderStatusChart data={orderStatusData} />
            <div className="lg:col-span-2">
                <TopProductsChart data={topProductsData} />
            </div>
        </div>
    );
}

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ period?: string }>;
}) {
    const { period = '7d' } = await searchParams;
    const cookieStore = await cookies();
    const language = (cookieStore.get('language')?.value || 'id') as Language;
    const t = getTranslation(language);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('dashboard')}</h1>
            </div>

            <Suspense fallback={
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                    <StatCardSkeleton />
                </div>
            }>
                <StatsSection t={t} language={language} />
            </Suspense>

            <div className="grid gap-6 md:grid-cols-2">
                <Suspense fallback={
                    <Card className="py-4 gap-0">
                        <CardHeader className="px-6 py-0 mb-4">
                            <Skeleton className="h-5 w-32" />
                        </CardHeader>
                        <CardContent className="px-6 py-0 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex justify-between">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                }>
                    <RecentOrdersSection t={t} language={language} />
                </Suspense>

                <Suspense fallback={
                    <Card className="py-4 gap-0">
                        <CardHeader className="px-6 py-0 mb-4">
                            <Skeleton className="h-5 w-32" />
                        </CardHeader>
                        <CardContent className="px-6 py-0 space-y-4">
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
                    <LowStockSection t={t} />
                </Suspense>
            </div>

            {/* Charts Section */}
            <Suspense fallback={
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Card className="py-4 gap-0">
                            <CardHeader className="px-6 py-0 mb-4"><Skeleton className="h-5 w-32" /></CardHeader>
                            <CardContent className="px-6 py-0"><Skeleton className="h-[300px]" /></CardContent>
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
                <ChartsSection period={period} />
            </Suspense>
        </div>
    );
}
