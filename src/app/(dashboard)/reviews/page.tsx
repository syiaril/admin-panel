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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Star, Check, X, Package } from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/formatters';
import { Review, Profile, Product } from '@/types/database';
import { ReviewActions } from './review-actions';
import { Pagination } from '@/components/ui/pagination';
import { cookies } from 'next/headers';
import { getTranslation } from '@/lib/i18n';

const ITEMS_PER_PAGE = 10;

interface ReviewWithRelations extends Review {
    profiles: Profile | null;
    products: Product | null;
}

async function getReviews(page: number = 1) {
    const supabase = await createClient();
    const from = (page - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data: reviews, error, count } = await supabase
        .from('reviews')
        .select(`
      *,
      profiles:user_id (*),
      products:product_id (id, name, slug)
    `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (error) {
        console.error('Error fetching reviews:', error);
        return { reviews: [], count: 0 };
    }

    return {
        reviews: reviews as ReviewWithRelations[],
        count: count || 0
    };
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

function ReviewsTableSkeleton({ t }: { t: any }) {
    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        {[t('products'), t('customer'), t('rating'), t('reviews'), t('status'), t('date')].map((h, i) => (
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

async function ReviewsTable({ page, t, language }: { page: number, t: any, language: string }) {
    const { reviews, count } = await getReviews(page);

    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t('products')}</TableHead>
                            <TableHead>{t('customer')}</TableHead>
                            <TableHead>{t('rating')}</TableHead>
                            <TableHead className="max-w-xs">{t('reviews')}</TableHead>
                            <TableHead>{t('status')}</TableHead>
                            <TableHead>{t('date')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reviews.length > 0 ? (
                            reviews.map((review) => (
                                <Dialog key={review.id}>
                                    <DialogTrigger asChild>
                                        <TableRow className="cursor-pointer hover:bg-muted/50 transition-colors">
                                            <TableCell>
                                                <span className="font-medium text-orange-600">
                                                    {review.products?.name || t('productNotAvailable')}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {review.profiles?.full_name || review.profiles?.email || t('anon')}
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
                                                        <><Check className="h-3 w-3 mr-1" />{t('review_approved')}</>
                                                    ) : (
                                                        t('review_pending')
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {formatRelativeTime(review.created_at, t)}
                                            </TableCell>
                                        </TableRow>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{t('reviewDetails')}</DialogTitle>
                                            <DialogDescription>
                                                {t('manageReviews')}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">{t('products')}</p>
                                                    <p className="font-medium">{review.products?.name || t('productNotAvailable')}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">{t('customer')}</p>
                                                    <p className="font-medium">{review.profiles?.full_name || review.profiles?.email || t('anon')}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">{t('rating')}</p>
                                                    <StarRating rating={review.rating} />
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">{t('date')}</p>
                                                    <p className="font-medium">{formatDate(review.created_at, language)}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium">{review.title}</p>
                                                <p className="text-sm text-muted-foreground">{review.content}</p>
                                            </div>
                                            <div className="flex justify-end pt-4 border-t">
                                                <ReviewActions review={review} />
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <Star className="h-8 w-8 text-muted-foreground" />
                                        <p className="text-muted-foreground">{t('noReviewsFound')}</p>
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

async function StatsCards({ t }: { t: any }) {
    const stats = await getReviewStats();

    return (
        <div className="grid gap-2 md:grid-cols-4 mb-4">
            <Card className="py-2 gap-0">
                <CardContent className="p-0 text-center">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-[10px] uppercase font-medium text-muted-foreground">{t('total')} {t('reviews')}</p>
                </CardContent>
            </Card>
            <Card className="py-2 gap-0">
                <CardContent className="p-0 text-center">
                    <div className="text-2xl font-bold flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        {stats.avgRating}
                    </div>
                    <p className="text-[10px] uppercase font-medium text-muted-foreground">{t('rating')}</p>
                </CardContent>
            </Card>
            <Card className="py-2 gap-0">
                <CardContent className="p-0 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                    <p className="text-[10px] uppercase font-medium text-muted-foreground">{t('review_approved')}</p>
                </CardContent>
            </Card>
            <Card className="py-2 gap-0">
                <CardContent className="p-0 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                    <p className="text-[10px] uppercase font-medium text-muted-foreground">{t('review_pending')}</p>
                </CardContent>
            </Card>
        </div>
    );
}

export default async function ReviewsPage({
    searchParams,
}: {
    searchParams: { page?: string };
}) {
    const page = Number((await searchParams).page) || 1;
    const cookieStore = await cookies();
    const language = (cookieStore.get('language')?.value || 'id') as any;
    const t = getTranslation(language);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('reviews')}</h1>
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
                <StatsCards t={t} />
            </Suspense>

            <Suspense fallback={<ReviewsTableSkeleton t={t} />}>
                <ReviewsTable page={page} t={t} language={language} />
            </Suspense>
        </div>
    );
}
