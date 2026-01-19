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
import { Plus, Image as ImageIcon, Pencil, ExternalLink, GripVertical } from 'lucide-react';
import { Banner } from '@/types/database';
import { BannerForm } from './banner-form';

async function getBanners() {
    const supabase = await createClient();

    const { data: banners, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order');

    if (error) {
        console.error('Error fetching banners:', error);
        return [];
    }

    return banners as Banner[];
}

function BannersTableSkeleton() {
    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        {['', 'Preview', 'Judul', 'Link', 'Status', 'Urutan', ''].map((h, i) => (
                            <TableHead key={i}>{h}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                            <TableCell><Skeleton className="h-20 w-40 rounded" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

async function BannersTable() {
    const banners = await getBanners();

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead>Preview</TableHead>
                        <TableHead>Judul</TableHead>
                        <TableHead>Link</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-center">Urutan</TableHead>
                        <TableHead className="w-10"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {banners.length > 0 ? (
                        banners.map((banner) => (
                            <TableRow key={banner.id}>
                                <TableCell>
                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                </TableCell>
                                <TableCell>
                                    <div className="w-40 h-20 rounded overflow-hidden bg-muted">
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
                                </TableCell>
                                <TableCell className="font-medium">{banner.title}</TableCell>
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
                                <TableCell>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
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
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
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
    );
}

export default function BannersPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Banner</h1>

                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-orange-500 hover:bg-orange-600">
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Banner
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Tambah Banner Baru</DialogTitle>
                            <DialogDescription>
                                Isi informasi banner di bawah ini
                            </DialogDescription>
                        </DialogHeader>
                        <BannerForm />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <Suspense fallback={<BannersTableSkeleton />}>
                        <BannersTable />
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
}
