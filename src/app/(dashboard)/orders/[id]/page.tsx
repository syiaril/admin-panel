import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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

async function getOrder(id: string): Promise<OrderWithDetails | null> {
    const supabase = await createClient();

    const { data: order, error } = await supabase
        .from('orders')
        .select(`
      *,
      profiles:user_id (
        id,
        full_name,
        email,
        phone
      ),
      order_items (
        *,
        product:product_id (
          id,
          name,
          slug
        )
      )
    `)
        .eq('id', id)
        .single();

    if (error || !order) {
        return null;
    }

    return order as OrderWithDetails;
}

export default async function OrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const order = await getOrder(id);

    if (!order) {
        notFound();
    }

    const statusInfo = getOrderStatusInfo(order.status);
    const paymentInfo = getPaymentStatusInfo(order.payment_status);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/orders">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold">{order.order_number}</h1>
                        <Badge className={statusInfo.bgColor}>{statusInfo.label}</Badge>
                        <Badge className={paymentInfo.bgColor}>{paymentInfo.label}</Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                        Dibuat pada {formatDateTime(order.created_at)}
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Left Column - Order Items & Summary */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Item Pesanan
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
                                                {formatPrice(item.unit_price)} × {item.quantity}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-medium">{formatPrice(item.subtotal)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator className="my-4" />

                            {/* Order Summary */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Ongkos Kirim</span>
                                    <span>{formatPrice(order.shipping_cost)}</span>
                                </div>
                                {order.discount_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Diskon</span>
                                        <span className="text-green-600">-{formatPrice(order.discount_amount)}</span>
                                    </div>
                                )}
                                {order.tax_amount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Pajak</span>
                                        <span>{formatPrice(order.tax_amount)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-bold">
                                    <span>Total</span>
                                    <span className="text-orange-600">{formatPrice(order.total_amount)}</span>
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
                                    Catatan
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {order.customer_notes && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Catatan Pelanggan:</p>
                                        <p className="text-sm">{order.customer_notes}</p>
                                    </div>
                                )}
                                {order.admin_notes && (
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Catatan Admin:</p>
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
                    <OrderStatusUpdater order={order} />

                    {/* Customer Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Pelanggan
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="font-medium">{order.profiles?.full_name || 'Guest'}</p>
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
                                        Lihat Profil
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
                                Pengiriman
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
                                    <span className="text-muted-foreground">Kurir</span>
                                    <span>{order.shipping_method ? shippingMethodLabels[order.shipping_method] || order.shipping_method : '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">No. Resi</span>
                                    <span className="font-mono">{order.tracking_number || '-'}</span>
                                </div>
                                {order.estimated_delivery && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Estimasi</span>
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
                                Pembayaran
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Metode</span>
                                <span>{paymentMethodLabels[order.payment_method] || order.payment_method}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Status</span>
                                <Badge className={paymentInfo.bgColor}>{paymentInfo.label}</Badge>
                            </div>
                            {order.paid_at && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Dibayar</span>
                                    <span>{formatDateTime(order.paid_at)}</span>
                                </div>
                            )}
                            {order.payment_proof_url && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer">
                                        Lihat Bukti Bayar
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
                                Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Dibuat</span>
                                    <span>{formatDateTime(order.created_at)}</span>
                                </div>
                                {order.confirmed_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Dikonfirmasi</span>
                                        <span>{formatDateTime(order.confirmed_at)}</span>
                                    </div>
                                )}
                                {order.shipped_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Dikirim</span>
                                        <span>{formatDateTime(order.shipped_at)}</span>
                                    </div>
                                )}
                                {order.delivered_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Terkirim</span>
                                        <span>{formatDateTime(order.delivered_at)}</span>
                                    </div>
                                )}
                                {order.completed_at && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Selesai</span>
                                        <span>{formatDateTime(order.completed_at)}</span>
                                    </div>
                                )}
                                {order.cancelled_at && (
                                    <div className="flex justify-between text-red-600">
                                        <span>Dibatalkan</span>
                                        <span>{formatDateTime(order.cancelled_at)}</span>
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
