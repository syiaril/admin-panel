import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
    ArrowLeft,
    Mail,
    Phone,
    Calendar,
    MapPin,
    ShoppingBag,
    Heart,
    Star,
} from 'lucide-react';
import { formatDate, formatPrice, getInitials, getOrderStatusInfo } from '@/lib/formatters';
import { Profile, Order, Address, WishlistItem } from '@/types/database';

interface CustomerDetails extends Profile {
    orders: Order[];
    addresses: Address[];
    wishlist_items: (WishlistItem & {
        product: { id: string; name: string; price: number } | null;
    })[];
}

async function getCustomer(id: string): Promise<CustomerDetails | null> {
    const supabase = createAdminClient();

    const { data: customer, error } = await supabase
        .from('profiles')
        .select(`
      *,
      orders (
        id,
        order_number,
        total_amount,
        status,
        created_at
      ),
      addresses (*),
      wishlist_items (
        id,
        created_at,
        product:product_id (
          id,
          name,
          price
        )
      )
    `)
        .eq('id', id)
        .single();

    if (error || !customer) {
        return null;
    }

    return customer as CustomerDetails;
}

export default async function CustomerDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const customer = await getCustomer(id);

    if (!customer) {
        notFound();
    }

    const totalSpent = customer.orders
        ?.filter(o => o.status !== 'cancelled' && o.status !== 'refunded')
        .reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/customers">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div className="flex-1 flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={customer.avatar_url || undefined} />
                        <AvatarFallback className="bg-orange-100 text-orange-600 text-xl">
                            {getInitials(customer.full_name || customer.email)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h1 className="text-2xl font-bold">{customer.full_name || 'Tanpa Nama'}</h1>
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {customer.email}
                            </span>
                            {customer.phone && (
                                <span className="flex items-center gap-1">
                                    <Phone className="h-4 w-4" />
                                    {customer.phone}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <Badge variant={customer.is_verified ? 'default' : 'secondary'}>
                    {customer.is_verified ? 'Terverifikasi' : 'Belum Verifikasi'}
                </Badge>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Stats & Info */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Statistik</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Pesanan</span>
                                <span className="font-medium">{customer.orders?.length || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Belanja</span>
                                <span className="font-medium text-orange-600">{formatPrice(totalSpent)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Wishlist</span>
                                <span className="font-medium">{customer.wishlist_items?.length || 0} item</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Bergabung</span>
                                <span>{formatDate(customer.created_at)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Addresses */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Alamat
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {customer.addresses && customer.addresses.length > 0 ? (
                                <div className="space-y-4">
                                    {customer.addresses.map((address) => (
                                        <div key={address.id} className="text-sm">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium">{address.label}</span>
                                                {address.is_default && (
                                                    <Badge variant="outline" className="text-xs">Default</Badge>
                                                )}
                                            </div>
                                            <p className="text-muted-foreground">{address.recipient_name}</p>
                                            <p className="text-muted-foreground">{address.phone}</p>
                                            <p className="text-muted-foreground">{address.address_line}</p>
                                            <p className="text-muted-foreground">
                                                {[address.district, address.city, address.province, address.postal_code]
                                                    .filter(Boolean)
                                                    .join(', ')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Belum ada alamat</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Orders */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5" />
                                Riwayat Pesanan
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {customer.orders && customer.orders.length > 0 ? (
                                <div className="space-y-3">
                                    {customer.orders.map((order) => {
                                        const statusInfo = getOrderStatusInfo(order.status);
                                        return (
                                            <Link
                                                key={order.id}
                                                href={`/orders/${order.id}`}
                                                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                            >
                                                <div>
                                                    <p className="font-medium text-orange-600">{order.order_number}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatDate(order.created_at)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">{formatPrice(order.total_amount)}</p>
                                                    <Badge className={statusInfo.bgColor}>{statusInfo.label}</Badge>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Belum ada pesanan
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Wishlist */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Heart className="h-5 w-5" />
                                Wishlist
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {customer.wishlist_items && customer.wishlist_items.length > 0 ? (
                                <div className="space-y-3">
                                    {customer.wishlist_items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-3 rounded-lg border"
                                        >
                                            <div>
                                                <p className="font-medium">{item.product?.name || 'Produk tidak tersedia'}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Ditambahkan {formatDate(item.created_at)}
                                                </p>
                                            </div>
                                            {item.product && (
                                                <p className="font-medium text-orange-600">
                                                    {formatPrice(item.product.price)}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Wishlist kosong
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
