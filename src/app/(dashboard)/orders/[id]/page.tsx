'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
    ArrowLeft,
    MapPin,
    Phone,
    User,
    Package,
    Truck,
    CreditCard,
    FileText,
    Calendar,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import {
    formatPrice,
    formatDateTime,
    getOrderStatusInfo,
    getPaymentStatusInfo,
    paymentMethodLabels,
    shippingMethodLabels,
} from '@/lib/formatters';
import { Order, OrderItem } from '@/types/database';
import { OrderStatusUpdater } from './order-status-updater';
import { fetchWithAuth } from '@/hooks/lib/api';
import { useLanguage } from '@/components/layout/language-provider';

interface OrderWithDetails extends Order {
    profiles: {
        id: string;
        full_name: string | null;
        email: string;
        phone: string | null;
    } | null;
    order_items: (OrderItem & {
        product: {
            id: string;
            name: string;
            slug: string;
        } | null;
    })[];
}

function OrderDetailSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <div className="flex-1">
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="flex gap-4">
                                    <Skeleton className="h-16 w-16 rounded-lg" />
                                    <div className="flex-1">
                                        <Skeleton className="h-5 w-48 mb-2" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                    <Skeleton className="h-5 w-20" />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-32" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function OrderDetailPage() {
    const { t, language } = useLanguage();
    const params = useParams();
    const orderId = params.id as string;

    const [order, setOrder] = useState<OrderWithDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOrder = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetchWithAuth(`/admin/orders/${orderId}`);

            if (response.success) {
                setOrder(response.data);
            } else {
                throw new Error(response.error || t('errorLoadingOrder'));
            }
        } catch (err) {
            console.error('Error fetching order:', err);
            setError(err instanceof Error ? err.message : t('errorLoadingOrder'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    if (isLoading) {
        return <OrderDetailSkeleton />;
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild title={t('backToOrders')}>
                        <Link href="/orders">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">{t('orderDetails')}</h1>
                </div>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={fetchOrder}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('tryAgain')}
                </Button>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild title={t('backToOrders')}>
                        <Link href="/orders">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h1 className="text-2xl font-bold">{t('orderNotFound')}</h1>
                </div>
                <p className="text-muted-foreground">{t('orderNotFoundDesc')}</p>
            </div>
        );
    }

    const statusInfo = getOrderStatusInfo(order.status, t);
    const paymentInfo = getPaymentStatusInfo(order.payment_status, t);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild title={t('backToOrders')}>
                    <Link href="/orders">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{order.order_number}</h1>
                        <Badge variant={statusInfo.color as any} className={statusInfo.bgColor}>{statusInfo.label}</Badge>
                        <Badge variant={paymentInfo.color as any} className={paymentInfo.bgColor}>{paymentInfo.label}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        {t('created')} {formatDateTime(order.created_at, language)}
                    </p>
                </div>
                <Button variant="outline" onClick={fetchOrder}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t('refresh')}
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Order Items & Summary */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                {t('orderItems')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.order_items.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                                            {item.product_image_url ? (
                                                <img
                                                    src={item.product_image_url}
                                                    alt={item.product_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <Package className="h-6 w-6 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{item.product_name}</p>
                                            <p className="text-sm text-muted-foreground">SKU: {item.product_sku}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatPrice(item.unit_price, language)} × {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-medium">{formatPrice(item.subtotal, language)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator className="my-4" />

                            {/* Order Summary */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t('subtotal')}</span>
                                    <span>{formatPrice(order.subtotal, language)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t('shippingCost')}</span>
                                    <span>{formatPrice(order.shipping_cost, language)}</span>
                                </div>
                                {order.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{t('discount')}</span>
                                        <span className="text-green-600">-{formatPrice(order.discount_amount, language)}</span>
                                    </div>
                                )}
                                {order.tax_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{t('tax')}</span>
                                        <span>{formatPrice(order.tax_amount, language)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-bold">
                                    <span>Total</span>
                                    <span className="text-orange-600">{formatPrice(order.total_amount, language)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Notes */}
                    {(order.customer_notes || order.admin_notes) && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    {t('notes')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {order.customer_notes && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t('customerNotes')}:</p>
                                        <p className="text-sm">{order.customer_notes}</p>
                                    </div>
                                )}
                                {order.admin_notes && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{t('adminNotes')}:</p>
                                        <p className="text-sm">{order.admin_notes}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column - Customer & Shipping Info */}
                <div className="space-y-6">
                    {/* Update Status */}
                    <OrderStatusUpdater order={order} onUpdate={fetchOrder} />

                    {/* Customer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                {t('customer')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="font-medium">{order.profiles?.full_name || t('guest')}</p>
                                <p className="text-sm text-muted-foreground">{order.profiles?.email}</p>
                            </div>
                            {order.profiles?.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{order.profiles.phone}</span>
                                </div>
                            )}
                            {order.profiles?.id && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/customers/${order.profiles.id}`}>
                                        {t('viewProfile')}
                                    </Link>
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Shipping Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                {t('shipping')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="font-medium">{order.shipping_name}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <span>{order.shipping_phone}</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2 text-sm">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div>
                                    <p>{order.shipping_address}</p>
                                    <p className="text-muted-foreground">
                                        {[order.shipping_city, order.shipping_province, order.shipping_postal_code]
                                            .filter(Boolean)
                                            .join(', ')}
                                    </p>
                                </div>
                            </div>
                            {order.shipping_notes && (
                                <p className="text-sm text-muted-foreground italic">&quot;{order.shipping_notes}&quot;</p>
                            )}
                            <Separator />
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('courier')}</span>
                                    <span>{order.shipping_method ? t(`shipping_${order.shipping_method.toLowerCase()}` as any) || order.shipping_method : '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('trackingNumber')}</span>
                                    <span className="font-mono">{order.tracking_number || '-'}</span>
                                </div>
                                {order.estimated_delivery && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('estimation')}</span>
                                        <span>{order.estimated_delivery}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                {t('paymentInfo')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('method')}</span>
                                <span>{order.payment_method ? t(`method_${order.payment_method.toLowerCase()}` as any) || order.payment_method : '-'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t('status')}</span>
                                <Badge variant={paymentInfo.color as any} className={paymentInfo.bgColor}>{paymentInfo.label}</Badge>
                            </div>
                            {order.paid_at && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t('paidAt')}</span>
                                    <span>{formatDateTime(order.paid_at, language)}</span>
                                </div>
                            )}
                            {order.payment_proof_url && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer">
                                        {t('viewPaymentProof')}
                                    </a>
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                {t('timeline')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{t('created')}</span>
                                    <span>{formatDateTime(order.created_at, language)}</span>
                                </div>
                                {order.confirmed_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('confirmed')}</span>
                                        <span>{formatDateTime(order.confirmed_at, language)}</span>
                                    </div>
                                )}
                                {order.shipped_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('shipped')}</span>
                                        <span>{formatDateTime(order.shipped_at, language)}</span>
                                    </div>
                                )}
                                {order.delivered_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('delivered')}</span>
                                        <span>{formatDateTime(order.delivered_at, language)}</span>
                                    </div>
                                )}
                                {order.completed_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('completed')}</span>
                                        <span>{formatDateTime(order.completed_at, language)}</span>
                                    </div>
                                )}
                                {order.cancelled_at && (
                                    <div className="flex justify-between text-red-600">
                                        <span>{t('cancelled')}</span>
                                        <span>{formatDateTime(order.cancelled_at, language)}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
