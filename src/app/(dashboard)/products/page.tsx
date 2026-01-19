// @ts-nocheck
import { Suspense } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
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
import { Plus, Eye, Package, Star, AlertTriangle } from 'lucide-react';
import { formatPrice, getStockStatusInfo } from '@/lib/formatters';
import { Product, Category, ProductImage } from '@/types/database';
import { cookies } from 'next/headers';
import { getTranslation } from '@/lib/i18n';

import { Pagination } from '@/components/ui/pagination';

interface ProductWithRelations extends Product {
    category: Category | null;
    product_images: ProductImage[];
}

const ITEMS_PER_PAGE = 10;

async function getProducts(page: number = 1) {
    const supabase = await createClient();
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data: products, error, count } = await supabase
        .from('products')
        .select(`
      *,
      category:category_id (
        id,
        name,
        slug
      ),
      product_images (
        id,
        image_url,
        is_primary,
        sort_order
      )
    `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('Error fetching products:', error);
        return { products: [], count: 0 };
    }

    return {
        products: products as ProductWithRelations[],
        count: count || 0
    };
}

async function getProductStats() {
    const supabase = await createClient();

    const { data: products } = await supabase
        .from('products')
        .select('is_active, stock, low_stock_threshold, is_featured');

    const stats = {
        total: products?.length || 0,
        active: products?.filter(p => p.is_active).length || 0,
        outOfStock: products?.filter(p => p.stock === 0).length || 0,
        lowStock: products?.filter(p => p.stock > 0 && p.stock <= (p.low_stock_threshold || 5)).length || 0,
        featured: products?.filter(p => p.is_featured).length || 0,
    };

    return stats;
}

function ProductsTableSkeleton({ t }: { t: any }) {
    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        {[t('preview'), t('productName'), t('category'), t('price'), t('stock'), t('status')].map((h, i) => (
                            <TableHead key={i} className={h === t('price') ? 'text-right' : h === t('stock') ? 'text-center' : ''}>{h}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-12 w-12 rounded" />
                                    <div>
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-3 w-20 mt-1" />
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

import { ProductsTable } from './products-table';

async function ProductsTableWrapper({ page, language }: { page: number, language: string }) {
    const { products, count } = await getProducts(page);
    return (
        <>
            <ProductsTable products={products} language={language} />
            <Pagination
                totalCount={count}
                pageSize={ITEMS_PER_PAGE}
                currentPage={page}
            />
        </>
    );
}

async function StatsCards({ t }: { t: any }) {
    const stats = await getProductStats();

    return (
        <div className="grid gap-2 md:grid-cols-5 mb-4">
            <Card className="py-2 gap-0">
                <CardContent className="p-0 text-center">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-[10px] uppercase font-medium text-muted-foreground">{t('totalProducts')}</p>
                </CardContent>
            </Card>
            <Card className="py-2 gap-0">
                <CardContent className="p-0 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                    <p className="text-[10px] uppercase font-medium text-muted-foreground">{t('active')}</p>
                </CardContent>
            </Card>
            <Card className="py-2 gap-0">
                <CardContent className="p-0 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.featured}</div>
                    <p className="text-[10px] uppercase font-medium text-muted-foreground">{t('featured')}</p>
                </CardContent>
            </Card>
            <Card className="py-2 gap-0">
                <CardContent className="p-0 text-center">
                    <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
                    <p className="text-[10px] uppercase font-medium text-muted-foreground">{t('lowStock')}</p>
                </CardContent>
            </Card>
            <Card className="py-2 gap-0">
                <CardContent className="p-0 text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
                    <p className="text-[10px] uppercase font-medium text-muted-foreground">{t('outOfStock')}</p>
                </CardContent>
            </Card>
        </div>
    );
}

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: { page?: string };
}) {
    const page = Number((await searchParams).page) || 1;
    const cookieStore = await cookies();
    const language = cookieStore.get('language')?.value as any || 'id';
    const t = getTranslation(language);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('products')}</h1>
                </div>
                <Button asChild className="bg-orange-500 hover:bg-orange-600">
                    <Link href="/products/new">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('addProduct')}
                    </Link>
                </Button>
            </div>

            <Suspense fallback={
                <div className="grid gap-4 md:grid-cols-5 mb-6">
                    {[...Array(5)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="pt-4">
                                <Skeleton className="h-8 w-12 mb-1" />
                                <Skeleton className="h-3 w-20" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            }>
                <StatsCards t={t} />
            </Suspense>

            <Card className="py-4 gap-0">
                <CardContent className="p-4 pt-0">
                    <Suspense fallback={<ProductsTableSkeleton t={t} />}>
                        <ProductsTableWrapper page={page} language={language} />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
