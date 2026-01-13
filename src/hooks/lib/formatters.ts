import { type OrderStatus, type PaymentStatus } from '@/types/database';

/**
 * Format price to Indonesian Rupiah
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

/**
 * Format number with thousand separator
 */
export function formatNumber(num: number): string {
    return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format date to Indonesian format
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...options,
    }).format(d);
}

/**
 * Format date with time
 */
export function formatDateTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta',
    }).format(d);
}

/**
 * Get relative time (e.g., "2 hari lalu")
 */
export function formatRelativeTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSeconds < 60) {
        return 'Baru saja';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} menit lalu`;
    } else if (diffHours < 24) {
        return `${diffHours} jam lalu`;
    } else if (diffDays < 7) {
        return `${diffDays} hari lalu`;
    } else if (diffWeeks < 4) {
        return `${diffWeeks} minggu lalu`;
    } else {
        return `${diffMonths} bulan lalu`;
    }
}

/**
 * Get order status display info
 */
export function getOrderStatusInfo(status: OrderStatus): {
    label: string;
    color: 'default' | 'secondary' | 'destructive' | 'outline';
    bgColor: string;
} {
    const statusMap: Record<OrderStatus, { label: string; color: 'default' | 'secondary' | 'destructive' | 'outline'; bgColor: string }> = {
        pending: { label: 'Menunggu', color: 'secondary', bgColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
        confirmed: { label: 'Dikonfirmasi', color: 'default', bgColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
        processing: { label: 'Diproses', color: 'default', bgColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
        shipped: { label: 'Dikirim', color: 'default', bgColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
        delivered: { label: 'Terkirim', color: 'default', bgColor: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
        completed: { label: 'Selesai', color: 'default', bgColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
        cancelled: { label: 'Dibatalkan', color: 'destructive', bgColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
        refunded: { label: 'Refund', color: 'destructive', bgColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    };
    return statusMap[status];
}

/**
 * Get payment status display info
 */
export function getPaymentStatusInfo(status: PaymentStatus): {
    label: string;
    color: 'default' | 'secondary' | 'destructive' | 'outline';
    bgColor: string;
} {
    const statusMap: Record<PaymentStatus, { label: string; color: 'default' | 'secondary' | 'destructive' | 'outline'; bgColor: string }> = {
        pending: { label: 'Belum Bayar', color: 'secondary', bgColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
        paid: { label: 'Lunas', color: 'default', bgColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
        failed: { label: 'Gagal', color: 'destructive', bgColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
        expired: { label: 'Kadaluarsa', color: 'outline', bgColor: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
        refunded: { label: 'Dikembalikan', color: 'destructive', bgColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
    };
    return statusMap[status];
}

/**
 * Get stock status display info
 */
export function getStockStatusInfo(stock: number, threshold: number): {
    label: string;
    color: 'default' | 'secondary' | 'destructive' | 'outline';
} {
    if (stock === 0) {
        return { label: 'Habis', color: 'destructive' };
    } else if (stock <= threshold) {
        return { label: 'Stok Rendah', color: 'secondary' };
    } else {
        return { label: 'Tersedia', color: 'default' };
    }
}

/**
 * Generate slug from string
 */
export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

/**
 * Get initials from name
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

/**
 * Payment method labels
 */
export const paymentMethodLabels: Record<string, string> = {
    cod: 'COD (Bayar di Tempat)',
    bank_transfer: 'Transfer Bank',
    ewallet: 'E-Wallet',
    credit_card: 'Kartu Kredit',
    virtual_account: 'Virtual Account',
};

/**
 * Shipping method labels
 */
export const shippingMethodLabels: Record<string, string> = {
    jne: 'JNE',
    jnt: 'J&T Express',
    sicepat: 'SiCepat',
    gojek: 'GoSend',
    grab: 'GrabExpress',
    pos: 'POS Indonesia',
    tiki: 'TIKI',
};
