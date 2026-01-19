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
import { Star, Check, X, Package } from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/formatters';
import { Review, Profile, Product } from '@/types/database';
import { ReviewActions } from './review-actions';

interface ReviewWithRelations extends Review {
    profiles: Profile | null;
    products: Product | null;
}

async function getReviews() {
    const supabase = await createClient();

    const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
      *,
      profiles:user_id (*),
      products:product_id (id, name, slug)
    `)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }

    return reviews as ReviewWithRelations[];
}

async function getReviewStats() {
    const supabase = await createClient();

    const { data: reviews } = await supabase
        .from('reviews')
        .select('rating, is_approved');

    const stats = {
        total: reviews?.length || 0,
        approved: reviews?.filter(r => r.is_approved).length || 0,
        pending: reviews?.filter(r => !r.is_approved).length || 0,
        avgRating: reviews?.length
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : '0',
    };

    return stats;
}

function ReviewsTableSkeleton() {
    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        {['Produk', 'Pelanggan', 'Rating', 'Review', 'Status', 'Tanggal', ''].map((h, i) => (
                            <TableHead key={i}>{h}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star
                    key={i}
                    className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                />
            ))}
        </div>
    );
}

async function ReviewsTable() {
    const reviews = await getReviews();

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Produk</TableHead>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead className="max-w-xs">Review</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead className="w-20"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reviews.length > 0 ? (
                        reviews.map((review) => (
                            <TableRow key={review.id}>
                                <TableCell>
                                    <span className="font-medium">
                                        {review.products?.name || 'Produk tidak tersedia'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {review.profiles?.full_name || review.profiles?.email || 'Anonim'}
                                </TableCell>
                                <TableCell>
                                    <StarRating rating={review.rating} />
                                </TableCell>
                                <TableCell className="max-w-xs">
                                    <div className="space-y-1">
                                        {review.title && (
                                            <p className="font-medium text-sm truncate">{review.title}</p>
                                        )}
                                        {review.content && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {review.content}
                                            </p>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={review.is_approved ? 'default' : 'secondary'}>
                                        {review.is_approved ? (
                                            <><Check className="h-3 w-3 mr-1" />Approved</>
                                        ) : (
                                            'Pending'
                                        )}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                    {formatRelativeTime(review.created_at)}
                                </TableCell>
                                <TableCell>
                                    <ReviewActions review={review} />
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Star className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-muted-foreground">Belum ada review</p>
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
    const stats = await getReviewStats();

    return (
        <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">Total Review</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold flex items-center gap-1">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        {stats.avgRating}
                    </div>
                    <p className="text-xs text-muted-foreground">Rating Rata-rata</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                    <p className="text-xs text-muted-foreground">Approved</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ReviewsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Ulasan</h1>

            </div>

            <Suspense fallback={
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="pt-4">
                                <Skeleton className="h-8 w-12 mb-1" />
                                <Skeleton className="h-3 w-24" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            }>
                <StatsCards />
            </Suspense>

            <Suspense fallback={<ReviewsTableSkeleton />}>
                <ReviewsTable />
            </Suspense>
        </div>
    );
}
