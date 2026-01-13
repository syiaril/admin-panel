import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { BarChart3, TrendingUp, Package, DollarSign } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/formatters';

async function getSalesReport() {
    const supabase = await createClient();

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at, status')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .not('status', 'in', '("cancelled","refunded")');

    const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
    const avgOrderValue = orders?.length ? totalRevenue / orders.length : 0;

    // Group by date
    const revenueByDate = orders?.reduce((acc, order) => {
        const date = new Date(order.created_at).toLocaleDateString('id-ID');
        acc[date] = (acc[date] || 0) + (order.total_amount || 0);
        return acc;
    }, {} as Record<string, number>) || {};

    return {
        totalRevenue,
        totalOrders: orders?.length || 0,
        avgOrderValue,
        revenueByDate,
    };
}

async function getTopProducts() {
    const supabase = await createClient();

    const { data: orderItems } = await supabase
        .from('order_items')
        .select(`
      product_id,
      product_name,
      quantity,
      subtotal
    `)
        .order('created_at', { ascending: false })
        .limit(500);

    const productStats = orderItems?.reduce((acc, item) => {
        if (!acc[item.product_id]) {
            acc[item.product_id] = {
                name: item.product_name,
                totalSold: 0,
                revenue: 0,
            };
        }
        acc[item.product_id].totalSold += item.quantity;
        acc[item.product_id].revenue += item.subtotal;
        return acc;
    }, {} as Record<string, { name: string; totalSold: number; revenue: number }>) || {};

    return Object.entries(productStats)
        .map(([id, stats]) => ({ id, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
}

async function getLowStockProducts() {
    const supabase = await createClient();

    const { data: products } = await supabase
        .from('products')
        .select('id, name, sku, stock, low_stock_threshold')
        .eq('is_active', true)
        .or('stock.lte.low_stock_threshold,stock.eq.0')
        .order('stock')
        .limit(20);

    return products || [];
}

function ReportSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="pt-4">
                            <Skeleton className="h-8 w-24 mb-1" />
                            <Skeleton className="h-4 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

async function SalesReport() {
    const report = await getSalesReport();

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-4">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <span className="text-2xl font-bold">{formatPrice(report.totalRevenue)}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Total Pendapatan (30 hari)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{report.totalOrders}</div>
                        <p className="text-sm text-muted-foreground">Total Pesanan (30 hari)</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-2xl font-bold">{formatPrice(report.avgOrderValue)}</div>
                        <p className="text-sm text-muted-foreground">Rata-rata Nilai Pesanan</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pendapatan Harian</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead className="text-right">Pendapatan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Object.entries(report.revenueByDate)
                                    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                                    .slice(0, 10)
                                    .map(([date, revenue]) => (
                                        <TableRow key={date}>
                                            <TableCell>{date}</TableCell>
                                            <TableCell className="text-right font-medium">
                                                {formatPrice(revenue)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

async function ProductReport() {
    const [topProducts, lowStockProducts] = await Promise.all([
        getTopProducts(),
        getLowStockProducts(),
    ]);

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Produk Terlaris
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produk</TableHead>
                                    <TableHead className="text-center">Terjual</TableHead>
                                    <TableHead className="text-right">Pendapatan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topProducts.length > 0 ? (
                                    topProducts.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="text-center">{product.totalSold}</TableCell>
                                            <TableCell className="text-right">{formatPrice(product.revenue)}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            Belum ada data
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-600">
                        <Package className="h-5 w-5" />
                        Stok Rendah / Habis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Produk</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-center">Stok</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lowStockProducts.length > 0 ? (
                                    lowStockProducts.map((product) => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                                            <TableCell className="text-center">
                                                <span className={product.stock === 0 ? 'text-red-600 font-bold' : 'text-yellow-600'}>
                                                    {product.stock}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            Semua produk stok aman 👍
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ReportsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Laporan</h1>
                <p className="text-muted-foreground">
                    Analisis penjualan dan performa toko
                </p>
            </div>

            <Tabs defaultValue="sales" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="sales">Penjualan</TabsTrigger>
                    <TabsTrigger value="products">Produk</TabsTrigger>
                </TabsList>

                <TabsContent value="sales">
                    <Suspense fallback={<ReportSkeleton />}>
                        <SalesReport />
                    </Suspense>
                </TabsContent>

                <TabsContent value="products">
                    <Suspense fallback={<ReportSkeleton />}>
                        <ProductReport />
                    </Suspense>
                </TabsContent>
            </Tabs>
        </div>
    );
}
