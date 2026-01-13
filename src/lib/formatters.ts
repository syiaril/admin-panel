import { OrderStatus, PaymentStatus } from "@/types/database";

export const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
};

export const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`;
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

export const getOrderStatusInfo = (status: OrderStatus) => {
    switch (status) {
        case "pending":
            return { label: "Menunggu", bgColor: "bg-yellow-100 text-yellow-800" };
        case "confirmed":
            return { label: "Dikonfirmasi", bgColor: "bg-blue-100 text-blue-800" };
        case "processing":
            return { label: "Diproses", bgColor: "bg-indigo-100 text-indigo-800" };
        case "shipped":
            return { label: "Dikirim", bgColor: "bg-purple-100 text-purple-800" };
        case "delivered":
            return { label: "Selesai", bgColor: "bg-green-100 text-green-800" };
        case "cancelled":
            return { label: "Dibatalkan", bgColor: "bg-red-100 text-red-800" };
        default:
            return { label: status, bgColor: "bg-gray-100 text-gray-800" };
    }
};

export const getPaymentStatusInfo = (status: PaymentStatus) => {
    switch (status) {
        case "pending":
            return { label: "Belum Bayar", bgColor: "bg-yellow-100 text-yellow-800" };
        case "paid":
            return { label: "Lunas", bgColor: "bg-green-100 text-green-800" };
        case "failed":
            return { label: "Gagal", bgColor: "bg-red-100 text-red-800" };
        default:
            return { label: status, bgColor: "bg-gray-100 text-gray-800" };
    }
};

export const getStockStatusInfo = (stock: number, lowStockThreshold: number) => {
    if (stock <= 0) {
        return { label: "Stok Habis", color: "destructive" };
    }
    if (stock <= lowStockThreshold) {
        return { label: "Stok Menipis", color: "warning" };
    }
    return { label: "Tersedia", color: "success" };
};

export const getReviewStatusInfo = (isApproved: boolean) => {
    if (isApproved) {
        return { label: "Disetujui", bgColor: "bg-green-100 text-green-800" };
    }
    return { label: "Menunggu", bgColor: "bg-yellow-100 text-yellow-800" };
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
