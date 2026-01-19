'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Plus, Package, Star } from 'lucide-react';
import { formatPrice, getStockStatusInfo } from '@/lib/formatters';
import { Product, Category, ProductImage } from '@/types/database';

interface ProductWithRelations extends Omit<Product, 'category'> {
    category: Category | null;
    product_images: ProductImage[];
}

import { useLanguage } from '@/components/layout/language-provider';

interface ProductsTableProps {
    products: ProductWithRelations[];
    language: string;
}

export function ProductsTable({ products, language }: ProductsTableProps) {
    const router = useRouter();
    const { t } = useLanguage();

    if (!products || products.length === 0) {
        return (
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('products')}</TableHead>
                            <TableHead>{t('category')}</TableHead>
                            <TableHead className="text-right">{t('price')}</TableHead>
                            <TableHead className="text-center">{t('stock')}</TableHead>
                            <TableHead>{t('status')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Package className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-muted-foreground">{t('noProductsFound')}</p>
                                    <Button asChild>
                                        <Link href="/products/new">
                                            <Plus className="mr-2 h-4 w-4" />
                                            {t('addProduct')}
                                        </Link>
                                    </Button>
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
                        <TableHead>{t('products')}</TableHead>
                        <TableHead>{t('category')}</TableHead>
                        <TableHead className="text-right">{t('price')}</TableHead>
                        <TableHead className="text-center">{t('stock')}</TableHead>
                        <TableHead>{t('status')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {products.map((product) => {
                        const statusInfo = getStockStatusInfo(product.stock, product.low_stock_threshold, t);
                        const primaryImage = product.product_images?.find(img => img.is_primary) || product.product_images?.[0];

                        return (
                            <TableRow
                                key={product.id}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => router.push(`/products/${product.id}/edit`)}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden border">
                                            {primaryImage ? (
                                                <img
                                                    src={primaryImage.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Package className="h-6 w-6 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1">
                                                <span className="font-medium text-orange-600 truncate">
                                                    {product.name}
                                                </span>
                                                {product.is_featured && (
                                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="font-normal">
                                        {product.category?.name || '-'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    <div>
                                        <p>{formatPrice(product.price, language)}</p>
                                        {product.compare_price && product.compare_price > product.price && (
                                            <p className="text-[10px] text-muted-foreground line-through decoration-red-400/50">
                                                {formatPrice(product.compare_price, language)}
                                            </p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-center">
                                    <span className="text-sm">{product.stock}</span>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={statusInfo.color as any} className="text-[10px] px-1.5 py-0">
                                        {statusInfo.label}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
