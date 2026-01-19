import { OrderStatus, PaymentStatus } from "@/types/database";

export const formatPrice = (price: number, lang: string = 'id') => {
    const locale = lang === 'en' ? 'en-US' : 'id-ID';
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

export const formatDate = (dateString: string, lang: string = 'id') => {
    const locale = lang === 'en' ? 'en-US' : 'id-ID';
    return new Date(dateString).toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const formatDateTime = (dateString: string, lang: string = 'id') => {
    const locale = lang === 'en' ? 'en-US' : 'id-ID';
    return new Date(dateString).toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const formatRelativeTime = (dateString: string, t?: any) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    const translate = (key: string, value?: number) => {
        if (!t) {
            if (key === 'time_just_now') return 'Baru saja';
            if (key === 'time_minutes_ago') return `${value} menit yang lalu`;
            if (key === 'time_hours_ago') return `${value} jam yang lalu`;
            if (key === 'time_days_ago') return `${value} hari yang lalu`;
            return formatDate(dateString);
        }
        if (key === 'time_just_now') return t('time_just_now');
        return `${value} ${t(key as any)}`;
    };

    if (diffInSeconds < 60) return translate('time_just_now');
    if (diffInSeconds < 3600) return translate('time_minutes_ago', Math.floor(diffInSeconds / 60));
    if (diffInSeconds < 86400) return translate('time_hours_ago', Math.floor(diffInSeconds / 3600));
    if (diffInSeconds < 604800) return translate('time_days_ago', Math.floor(diffInSeconds / 86400));
    return formatDate(dateString);
};

export const generateSlug = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-')   // Replace multiple - with single -
        .replace(/^-+/, '')       // Trim - from start of text
        .replace(/-+$/, '');      // Trim - from end of text
};

export const getOrderStatusInfo = (status: OrderStatus, t?: any) => {
    const label = t ? t(`status_${status}` as any) : {
        pending: 'Menunggu',
        confirmed: 'Dikonfirmasi',
        processing: 'Diproses',
        shipped: 'Dikirim',
        delivered: 'Selesai',
        completed: 'Selesai',
        cancelled: 'Dibatalkan',
        refunded: 'Dikembalikan',
    }[status] || status;

    switch (status) {
        case "pending":
            return { label, color: "warning" as const, bgColor: "bg-yellow-100 text-yellow-800" };
        case "confirmed":
            return { label, color: "info" as const, bgColor: "bg-blue-100 text-blue-800" };
        case "processing":
            return { label, color: "info" as const, bgColor: "bg-indigo-100 text-indigo-800" };
        case "shipped":
            return { label, color: "info" as const, bgColor: "bg-purple-100 text-purple-800" };
        case "delivered":
        case "completed":
            return { label, color: "success" as const, bgColor: "bg-green-100 text-green-800" };
        case "cancelled":
        case "refunded":
            return { label, color: "destructive" as const, bgColor: "bg-red-100 text-red-800" };
        default:
            return { label, color: "outline" as const, bgColor: "bg-gray-100 text-gray-800" };
    }
};

export const getPaymentStatusInfo = (status: PaymentStatus, t?: any) => {
    const label = t ? t(`payment_${status}` as any) : {
        pending: 'Belum Bayar',
        paid: 'Lunas',
        failed: 'Gagal',
        expired: 'Kadaluwarsa',
        refunded: 'Dikembalikan',
    }[status] || status;

    switch (status) {
        case "pending":
            return { label, color: "warning" as const, bgColor: "bg-yellow-100 text-yellow-800" };
        case "paid":
            return { label, color: "success" as const, bgColor: "bg-green-100 text-green-800" };
        case "failed":
        case "expired":
        case "refunded":
            return { label, color: "destructive" as const, bgColor: "bg-red-100 text-red-800" };
        default:
            return { label, color: "outline" as const, bgColor: "bg-gray-100 text-gray-800" };
    }
};

export const getStockStatusInfo = (stock: number, lowStockThreshold: number, t?: any) => {
    if (stock <= 0) {
        return { label: t ? t('stock_out') : "Stok Habis", color: "destructive" as const };
    }
    if (stock <= lowStockThreshold) {
        return { label: t ? t('stock_low') : "Stok Menipis", color: "warning" as const };
    }
    return { label: t ? t('stock_available') : "Tersedia", color: "success" as const };
};

export const getReviewStatusInfo = (isApproved: boolean, t?: any) => {
    if (isApproved) {
        return { label: t ? t('status_approved') : "Disetujui", bgColor: "bg-green-100 text-green-800" };
    }
    return { label: t ? t('status_pending') : "Menunggu", bgColor: "bg-yellow-100 text-yellow-800" };
};

export const getInitials = (name: string) => {
    return name
        .match(/(^\S\S?|\b\S)?/g)
        ?.join("")
        .match(/(^\S|\S$)?/g)
        ?.join("")
        .toUpperCase();
};

export const paymentMethodLabels: Record<string, string> = {
    bank_transfer: "Transfer Bank",
    ewallet: "E-Wallet",
    qris: "QRIS",
    cod: "Bayar di Tempat (COD)",
};

export const shippingMethodLabels: Record<string, string> = {
    jne: "JNE",
    jnt: "J&T",
    sicepat: "SiCepat",
    instant: "Instant (Gojek/Grab)",
};
