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
import { Plus, FolderTree, Pencil, Package } from 'lucide-react';
import { Category } from '@/types/database';
import { CategoryForm } from './category-form';

interface CategoryWithCount extends Category {
    parent: { name: string } | null;
    products: { count: number }[];
}

async function getCategories() {
    const supabase = await createClient();

    const { data: categories, error } = await supabase
        .from('categories')
        .select(`
      *,
      parent:parent_id (name),
      products (count)
    `)
        .order('sort_order');

    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }

    return categories as CategoryWithCount[];
}

function CategoriesTableSkeleton() {
    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        {['Kategori', 'Slug', 'Parent', 'Produk', 'Status', ''].map((h, i) => (
                            <TableHead key={i}>{h}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

async function CategoriesTable() {
    const categories = await getCategories();

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Kategori</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead className="text-center">Produk</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-10"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {categories.length > 0 ? (
                        categories.map((category) => {
                            const productCount = category.products?.[0]?.count || 0;

                            return (
                                <TableRow key={category.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                                                {category.image_url ? (
                                                    <img
                                                        src={category.image_url}
                                                        alt={category.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <FolderTree className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <span className="font-medium">{category.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground font-mono text-sm">
                                        {category.slug}
                                    </TableCell>
                                    <TableCell>
                                        {category.parent?.name || '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">{productCount}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={category.is_active ? 'default' : 'secondary'}>
                                            {category.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Edit Kategori</DialogTitle>
                                                    <DialogDescription>
                                                        Ubah informasi kategori
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <CategoryForm
                                                    category={category}
                                                    categories={categories.filter(c => c.id !== category.id)}
                                                />
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <FolderTree className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-muted-foreground">Belum ada kategori</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

async function CategoriesWrapper() {
    const categories = await getCategories();

    return (
        <>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Kategori</h1>

                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-orange-500 hover:bg-orange-600">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Kategori
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Kategori Baru</DialogTitle>
                            <DialogDescription>
                                Isi informasi kategori di bawah ini
                            </DialogDescription>
                        </DialogHeader>
                        <CategoryForm categories={categories} />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Suspense fallback={<CategoriesTableSkeleton />}>
                        <CategoriesTable />
                    </Suspense>
                </CardContent>
            </Card>
        </>
    );
}

export default function CategoriesPage() {
    return (
        <div className="space-y-6">
            <Suspense fallback={
                <>
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-9 w-32" />

                        </div>
                        <Skeleton className="h-10 w-40" />
                    </div>
                    <Card>
                        <CardContent className="pt-6">
                            <CategoriesTableSkeleton />
                        </CardContent>
                    </Card>
                </>
            }>
                <CategoriesWrapper />
            </Suspense>
        </div>
    );
}
