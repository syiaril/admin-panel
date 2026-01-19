import { Suspense } from 'react';
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
import { Plus, Image as ImageIcon, ExternalLink, Trash2 } from 'lucide-react';
import { Banner } from '@/types/database';
import { BannerForm } from './banner-form';
import { Pagination } from '@/components/ui/pagination';

const ITEMS_PER_PAGE = 10;

async function getBanners(page: number = 1) {
    const supabase = await createClient();
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data: banners, error, count } = await supabase
        .from('banners')
        .select('*', { count: 'exact' })
        .order('sort_order', { ascending: true })
        .range(from, to);

    if (error) {
        console.error('Error fetching banners:', error);
        return { banners: [], count: 0 };
    }

    return {
        banners: banners as Banner[],
        count: count || 0
    };
}

function BannersTableSkeleton() {
    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        {['Banner', 'Judul', 'Link', 'Status', 'Urutan'].map((h, i) => (
                            <TableHead key={i} className={h === 'Urutan' ? 'text-center' : ''}>{h}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-20 w-40 rounded" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16 mx-auto" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

async function BannersTable({ page }: { page: number }) {
    const { banners, count } = await getBanners(page);

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Banner</TableHead>
                            <TableHead>Judul</TableHead>
                            <TableHead>Link</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-center">Urutan</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {banners.length > 0 ? (
                            banners.map((banner) => (
                                <TableRow key={banner.id}>
                                    <TableCell colSpan={2} className="p-0">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <div className="flex items-center gap-0 cursor-pointer group w-full h-full">
                                                    <div className="w-[200px] aspect-[21/9] bg-muted overflow-hidden border-r group-hover:opacity-80 transition-opacity">
                                                        {banner.image_url ? (
                                                            <img
                                                                src={banner.image_url}
                                                                alt={banner.title}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="px-4 py-2 font-medium text-orange-600 group-hover:underline">
                                                        {banner.title}
                                                    </div>
                                                </div>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Edit Banner</DialogTitle>
                                                    <DialogDescription>
                                                        Ubah informasi banner
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <BannerForm banner={banner} />
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                    <TableCell>
                                        {banner.link_url ? (
                                            <a
                                                href={banner.link_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                                <span className="truncate max-w-[200px]">{banner.link_url}</span>
                                            </a>
                                        ) : (
                                            <span className="text-muted-foreground">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={banner.is_active ? 'default' : 'secondary'}>
                                            {banner.is_active ? 'Aktif' : 'Nonaktif'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">{banner.sort_order}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                        <p className="text-muted-foreground">Belum ada banner</p>
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

export default async function BannersPage({
    searchParams,
}: {
    searchParams: { page?: string };
}) {
    const page = Number((await searchParams).page) || 1;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Banner</h1>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-orange-500 hover:bg-orange-600">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah</DialogTitle>
                        </DialogHeader>
                        <BannerForm />
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="py-4 gap-0">
                <CardContent className="p-4 pt-0">
                    <Suspense fallback={<BannersTableSkeleton />}>
                        <BannersTable page={page} />
                    </Suspense>
                </CardContent>
            </Card>
        </div >
    );
}
