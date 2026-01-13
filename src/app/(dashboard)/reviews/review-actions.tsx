'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, X, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { createClient } from '@/lib/supabase/client';
import { Review } from '@/types/database';

interface ReviewActionsProps {
    review: Review;
}

export function ReviewActions({ review }: ReviewActionsProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const updateApproval = async (isApproved: boolean) => {
        setIsLoading(true);

        const { error } = await supabase
            .from('reviews')
            .update({
                is_approved: isApproved,
                updated_at: new Date().toISOString(),
            })
            .eq('id', review.id);

        if (error) {
            toast.error('Gagal update review', {
                description: error.message,
            });
        } else {
            toast.success(isApproved ? 'Review disetujui' : 'Review ditolak');
            router.refresh();
        }

        setIsLoading(false);
    };

    const deleteReview = async () => {
        setIsLoading(true);

        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', review.id);

        if (error) {
            toast.error('Gagal hapus review', {
                description: error.message,
            });
        } else {
            toast.success('Review berhasil dihapus');
            router.refresh();
        }

        setIsLoading(false);
    };

    return (
        <div className="flex items-center gap-1">
            {!review.is_approved && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => updateApproval(true)}
                    disabled={isLoading}
                >
                    <Check className="h-4 w-4" />
                </Button>
            )}
            {review.is_approved && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                    onClick={() => updateApproval(false)}
                    disabled={isLoading}
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={isLoading}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Review</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus review ini? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={deleteReview}
                        >
                            Ya, Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
