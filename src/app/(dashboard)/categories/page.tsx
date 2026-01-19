// @ts-nocheck
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, FolderTree, Package } from 'lucide-react';
import { Category } from '@/types/database';
import { CategoryForm } from './category-form';
import { cookies } from 'next/headers';
import { getTranslation } from '@/lib/i18n';

import { Pagination } from '@/components/ui/pagination';

interface CategoryWithCount extends Category {
    parent: { name: string } | null;
    products: { count: number }[];
}

const ITEMS_PER_PAGE = 10;

async function getCategories(page: number = 1) {
    const supabase = await createClient();
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data: categories, error, count } = await supabase
        .from('categories')
        .select(`
      *,
      parent:parent_id (name),
      products (count)
    `, { count: 'exact' })
        .order('sort_order', { ascending: true })
        .range(from, to);

    if (error) {
        console.error('Error fetching categories:', error);
        return { categories: [], count: 0 };
    }

    return {
        categories: categories as CategoryWithCount[],
        count: count || 0
    };
}

function CategoriesTableSkeleton({ t }: { t: any }) {
    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        {[t('category'), t('slug'), t('parent'), t('items'), t('status')].map((h, i) => (
                            <TableHead key={i} className={h === t('items') ? 'text-center' : ''}>{h}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <Skeleton className="h-4 w-32" />
                            </TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell>
                                <div className="flex justify-center">
                                    <Skeleton className="h-4 w-8" />
                                </div>
                            </TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

async function CategoriesTable({ page, t }: { page: number, t: any }) {
    const { categories, count } = await getCategories(page);

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('category')}</TableHead>
                            <TableHead>{t('slug')}</TableHead>
                            <TableHead>{t('parent')}</TableHead>
                            <TableHead className="text-center">{t('items')}</TableHead>
                            <TableHead>{t('status')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.length > 0 ? (
                            categories.map((category) => {
                                const productCount = category.products?.[0]?.count || 0;

                                return (
                                    <TableRow key={category.id}>
                                        <TableCell>
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <div className="cursor-pointer group">
                                                        <span className="font-medium text-orange-600 group-hover:underline">
                                                            {category.name}
                                                        </span>
                                                    </div>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>{t('editCategory')}</DialogTitle>
                                                        <DialogDescription>
                                                            {t('changeCategoryInfo')}
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <CategoryForm
                                                        category={category}
                                                        categories={categories.filter(c => c.id !== category.id)}
                                                    />
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground font-mono text-sm">
                                            {category.slug}
                                        </TableCell>
                                        <TableCell>
                                            {category.parent?.name || '-'}
                                        </TableCell>
                                        <TableCell className="text-center text-muted-foreground">
                                            {productCount}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={category.is_active ? 'default' : 'secondary'}>
                                                {category.is_active ? t('active') : t('inactive')}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <FolderTree className="h-8 w-8 text-muted-foreground" />
                                        <p className="text-muted-foreground">{t('noCategoriesFound')}</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <Pagination
                totalCount={count}
                pageSize={ITEMS_PER_PAGE}
                currentPage={page}
            />
        </div>
    );
}

async function CategoriesWrapper({ page, t }: { page: number, t: any }) {
    const { categories } = await getCategories(1); // Fetch all for the form, but could be optimized

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('categories')}</h1>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-orange-500 hover:bg-orange-600">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('addProduct')}
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('addCategory')}</DialogTitle>
                        </DialogHeader>
                        <CategoryForm categories={categories} />
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="py-4 gap-0">
                <CardContent className="p-4 pt-0">
                    <Suspense fallback={<CategoriesTableSkeleton t={t} />}>
                        <CategoriesTable page={page} t={t} />
                    </Suspense>
                </CardContent>
            </Card>
        </>
    );
}

export default async function CategoriesPage({
    searchParams,
}: {
    searchParams: { page?: string };
}) {
    const page = Number((await searchParams).page) || 1;
    const cookieStore = await cookies();
    const language = (cookieStore.get('language')?.value as any) || 'id';
    const t = getTranslation(language);

    return (
        <div className="space-y-4">
            <Suspense fallback={
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-9 w-32" />

                        </div>
                        <Skeleton className="h-10 w-40" />
                    </div>
                    <Card className="py-4 gap-0">
                        <CardContent className="p-4 pt-0">
                            <CategoriesTableSkeleton t={t} />
                        </CardContent>
                    </Card>
                </>
            }>
                <CategoriesWrapper page={page} t={t} />
            </Suspense>
        </div>
    );
}
