import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings, Store, Truck, CreditCard, Bell } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
                <p className="text-muted-foreground">
                    Kelola pengaturan toko dan admin panel
                </p>
            </div>

            <div className="grid gap-6">
                {/* Store Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="h-5 w-5" />
                            Informasi Toko
                        </CardTitle>
                        <CardDescription>
                            Pengaturan umum toko
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium">Nama Toko</label>
                                <p className="text-muted-foreground">Kedai Species</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Tagline</label>
                                <p className="text-muted-foreground">Perlengkapan Pramuka Terlengkap</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Email</label>
                                <p className="text-muted-foreground">info@kedaispecies.com</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Telepon</label>
                                <p className="text-muted-foreground">+62 812-3456-7890</p>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <label className="text-sm font-medium">Alamat</label>
                            <p className="text-muted-foreground">
                                Jl. Pramuka No. 123, Jakarta Selatan, DKI Jakarta 12345
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Shipping Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Pengiriman
                        </CardTitle>
                        <CardDescription>
                            Metode pengiriman yang tersedia
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-3">
                            {[
                                { name: 'JNE', desc: 'Regular & Express' },
                                { name: 'J&T Express', desc: 'Regular' },
                                { name: 'SiCepat', desc: 'Regular & Halu' },
                                { name: 'POS Indonesia', desc: 'Paket & Express' },
                                { name: 'GoSend', desc: 'Same Day' },
                                { name: 'GrabExpress', desc: 'Instant & Same Day' },
                            ].map((courier) => (
                                <div
                                    key={courier.name}
                                    className="flex items-center justify-between p-3 rounded-lg border"
                                >
                                    <div>
                                        <p className="font-medium">{courier.name}</p>
                                        <p className="text-xs text-muted-foreground">{courier.desc}</p>
                                    </div>
                                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                                        Aktif
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Pembayaran
                        </CardTitle>
                        <CardDescription>
                            Metode pembayaran yang tersedia
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2">
                            {[
                                { name: 'Transfer Bank', desc: 'BCA, Mandiri, BNI, BRI' },
                                { name: 'Virtual Account', desc: 'Semua bank' },
                                { name: 'E-Wallet', desc: 'GoPay, OVO, Dana, ShopeePay' },
                                { name: 'COD', desc: 'Bayar di tempat' },
                            ].map((payment) => (
                                <div
                                    key={payment.name}
                                    className="flex items-center justify-between p-3 rounded-lg border"
                                >
                                    <div>
                                        <p className="font-medium">{payment.name}</p>
                                        <p className="text-xs text-muted-foreground">{payment.desc}</p>
                                    </div>
                                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                                        Aktif
                                    </span>
                                </div>
                            ))}
                        </div>

                        <Separator className="my-4" />

                        <div>
                            <h4 className="font-medium mb-2">Rekening Bank</h4>
                            <div className="space-y-2">
                                <div className="p-3 rounded-lg bg-muted">
                                    <p className="font-medium">Bank BCA</p>
                                    <p className="text-sm text-muted-foreground">1234567890 - Kedai Species</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted">
                                    <p className="font-medium">Bank Mandiri</p>
                                    <p className="text-sm text-muted-foreground">9876543210 - Kedai Species</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notifikasi
                        </CardTitle>
                        <CardDescription>
                            Pengaturan notifikasi admin
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { label: 'Pesanan Baru', desc: 'Notifikasi saat ada pesanan masuk', enabled: true },
                                { label: 'Pembayaran Diterima', desc: 'Notifikasi saat pembayaran dikonfirmasi', enabled: true },
                                { label: 'Stok Rendah', desc: 'Notifikasi saat stok produk di bawah batas', enabled: true },
                                { label: 'Review Baru', desc: 'Notifikasi saat ada review masuk', enabled: false },
                            ].map((notif) => (
                                <div
                                    key={notif.label}
                                    className="flex items-center justify-between p-3 rounded-lg border"
                                >
                                    <div>
                                        <p className="font-medium">{notif.label}</p>
                                        <p className="text-xs text-muted-foreground">{notif.desc}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${notif.enabled
                                            ? 'bg-green-100 text-green-600'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {notif.enabled ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
