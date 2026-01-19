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
import { Plus, MoreHorizontal, Pencil, Eye, Package, Star, AlertTriangle } from 'lucide-react';
import { formatPrice, getStockStatusInfo } from '@/lib/formatters';
import { Product, Category, ProductImage } from '@/types/database';

interface ProductWithRelations extends Product {
    category: Category | null;
    product_images: ProductImage[];
}

async function getProducts() {
    const supabase = await createClient();

    const { data: products, error } = await supabase
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
    `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching products:', error);
        return [];
    }

    return products as ProductWithRelations[];
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

function ProductsTableSkeleton() {
    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        {['Produk', 'Kategori', 'Harga', 'Stok', 'Status', ''].map((h, i) => (
                            <TableHead key={i}>{h}</TableHead>
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
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

async function ProductsTable() {
    const products = await getProducts();

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Kategori</TableHead>
                        <TableHead className="text-right">Harga</TableHead>
                        <TableHead className="text-center">Stok</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.length > 0 ? (
                        products.map((product) => {
                            const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];
                            const stockInfo = getStockStatusInfo(product.stock, product.low_stock_threshold);

                            return (
                                <TableRow key={product.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                                                {primaryImage?.image_url ? (
                                                    <img
                                                        src={primaryImage.image_url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <Package className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/products/${product.id}/edit`}
                                                    className="font-medium hover:underline text-orange-600 truncate block"
                                                >
                                                    {product.name}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">{product.sku}</p>
                                                <div className="flex gap-1 mt-1">
                                                    {product.is_featured && (
                                                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                            <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                                                            Featured
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{product.category?.name || '-'}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div>
                                            <p className="font-medium">{formatPrice(product.price)}</p>
                                            {product.compare_price && product.compare_price > product.price && (
                                                <p className="text-xs text-muted-foreground line-through">
                                                    {formatPrice(product.compare_price)}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={stockInfo.color}>
                                            {product.stock === 0 ? (
                                                <><AlertTriangle className="h-3 w-3 mr-1" />Habis</>
                                            ) : (
                                                product.stock
                                            )}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                                            {product.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
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
                                                    <Link href={`/products/${product.id}/edit`}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
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
                            <TableCell colSpan={6} className="h-24 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Package className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-muted-foreground">Belum ada produk</p>
                                    <Button asChild>
                                        <Link href="/products/new">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Tambah Produk
                                        </Link>
                                    </Button>
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
    const stats = await getProductStats();

    return (
        <div className="grid gap-4 md:grid-cols-5 mb-6">
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">Total Produk</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                    <p className="text-xs text-muted-foreground">Aktif</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-yellow-600">{stats.featured}</div>
                    <p className="text-xs text-muted-foreground">Featured</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-orange-600">{stats.lowStock}</div>
                    <p className="text-xs text-muted-foreground">Stok Rendah</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
                    <p className="text-xs text-muted-foreground">Habis</p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Produk</h1>

                </div>
                <Button asChild className="bg-orange-500 hover:bg-orange-600">
                    <Link href="/products/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Produk
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
                <StatsCards />
            </Suspense>

            <Suspense fallback={<ProductsTableSkeleton />}>
                <ProductsTable />
            </Suspense>
        </div>
    );
}
