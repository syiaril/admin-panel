'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PaginationProps {
    totalCount: number;
    pageSize: number;
    currentPage: number;
}

export function Pagination({ totalCount, pageSize, currentPage }: PaginationProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const totalPages = Math.ceil(totalCount / pageSize);

    if (totalPages <= 1) return null;

    const createPageURL = (pageNumber: number | string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', pageNumber.toString());
        return `${pathname}?${params.toString()}`;
    };

    const getPageNumbers = () => {
        const pages = [];
        const displayLimit = 5;

        if (totalPages <= displayLimit) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always include first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Pages around current page
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) {
                    pages.push(i);
                }
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Always include last page
            if (!pages.includes(totalPages)) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div className="flex items-center justify-center space-x-2 py-4">
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage <= 1}
                asChild={currentPage > 1}
            >
                {currentPage > 1 ? (
                    <Link href={createPageURL(currentPage - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                        <span className="sr-only">Previous Page</span>
                    </Link>
                ) : (
                    <ChevronLeft className="h-4 w-4" />
                )}
            </Button>

            <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => {
                    if (page === '...') {
                        return (
                            <div
                                key={`ellipsis-${index}`}
                                className="flex h-8 w-8 items-center justify-center"
                            >
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </div>
                        );
                    }

                    const isCurrent = currentPage === page;

                    return (
                        <Button
                            key={`page-${page}`}
                            variant={isCurrent ? 'default' : 'outline'}
                            size="icon"
                            className={cn(
                                "h-8 w-8 text-sm",
                                isCurrent && "bg-orange-500 hover:bg-orange-600 border-orange-500"
                            )}
                            asChild={!isCurrent}
                        >
                            {!isCurrent ? (
                                <Link href={createPageURL(page as number)}>
                                    {page}
                                </Link>
                            ) : (
                                <span>{page}</span>
                            )}
                        </Button>
                    );
                })}
            </div>

            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={currentPage >= totalPages}
                asChild={currentPage < totalPages}
            >
                {currentPage < totalPages ? (
                    <Link href={createPageURL(currentPage + 1)}>
                        <ChevronRight className="h-4 w-4" />
                        <span className="sr-only">Next Page</span>
                    </Link>
                ) : (
                    <ChevronRight className="h-4 w-4" />
                )}
            </Button>
        </div>
    );
}
