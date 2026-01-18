'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Order, OrderStatus } from '@/types/database';
import { getOrderStatusInfo } from '@/lib/formatters';
import { fetchWithAuth } from '@/hooks/lib/api';

const statusTransitions: Record<OrderStatus, { next: OrderStatus[]; cancel?: boolean }> = {
    pending: { next: ['confirmed'], cancel: true },
    confirmed: { next: ['processing'], cancel: true },
    processing: { next: ['shipped'], cancel: true },
    shipped: { next: ['delivered'], cancel: false },
    delivered: { next: ['completed'], cancel: false },
    completed: { next: [], cancel: false },
    cancelled: { next: [], cancel: false },
    refunded: { next: [], cancel: false },
};

const statusActions: Record<OrderStatus, string> = {
    confirmed: 'Konfirmasi Pesanan',
    processing: 'Proses Pesanan',
    shipped: 'Kirim Pesanan',
    delivered: 'Tandai Terkirim',
    completed: 'Selesaikan Pesanan',
    cancelled: 'Batalkan Pesanan',
    refunded: 'Refund Pesanan',
    pending: 'Menunggu',
};

interface OrderStatusUpdaterProps {
    order: Order;
    onUpdate?: () => void;
}

export function OrderStatusUpdater({ order, onUpdate }: OrderStatusUpdaterProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
    const [adminNotes, setAdminNotes] = useState(order.admin_notes || '');
    const [cancelReason, setCancelReason] = useState('');

    const transitions = statusTransitions[order.status];
    const nextStatuses = transitions.next;
    const canCancel = transitions.cancel;

    const updateStatus = async (newStatus: OrderStatus) => {
        setIsLoading(true);

        const updateData: Record<string, unknown> = {
            status: newStatus,
        };

        // Add tracking number if shipping
        if (newStatus === 'shipped' && trackingNumber) {
            updateData.tracking_number = trackingNumber;
        }

        // Add cancel reason if cancelling
        if (newStatus === 'cancelled' && cancelReason) {
            updateData.cancel_reason = cancelReason;
        }

        // Add admin notes if changed
        if (adminNotes && adminNotes !== order.admin_notes) {
            updateData.admin_notes = adminNotes;
        }

        try {
            const response = await fetchWithAuth(`/admin/orders/${order.id}`, {
                method: 'PATCH',
                body: JSON.stringify(updateData),
            });

            if (response.success) {
                toast.success('Status berhasil diupdate', {
                    description: `Pesanan ${order.order_number} sekarang ${getOrderStatusInfo(newStatus).label}`,
                });
                onUpdate?.();
            } else {
                throw new Error(response.error || 'Failed to update status');
            }
        } catch (err) {
            toast.error('Gagal update status', {
                description: err instanceof Error ? err.message : 'Terjadi kesalahan',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const saveTrackingNumber = async () => {
        if (!trackingNumber.trim()) {
            toast.error('Nomor resi tidak boleh kosong');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetchWithAuth(`/admin/orders/${order.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    tracking_number: trackingNumber,
                }),
            });

            if (response.success) {
                toast.success('Nomor resi berhasil disimpan');
                onUpdate?.();
            } else {
                throw new Error(response.error || 'Failed to save tracking number');
            }
        } catch (err) {
            toast.error('Gagal menyimpan nomor resi', {
                description: err instanceof Error ? err.message : 'Terjadi kesalahan',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const saveAdminNotes = async () => {
        setIsLoading(true);

        try {
            const response = await fetchWithAuth(`/admin/orders/${order.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    admin_notes: adminNotes,
                }),
            });

            if (response.success) {
                toast.success('Catatan berhasil disimpan');
                onUpdate?.();
            } else {
                throw new Error(response.error || 'Failed to save notes');
            }
        } catch (err) {
            toast.error('Gagal menyimpan catatan', {
                description: err instanceof Error ? err.message : 'Terjadi kesalahan',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (nextStatuses.length === 0 && !canCancel) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Update Status</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Pesanan ini sudah {getOrderStatusInfo(order.status).label.toLowerCase()} dan tidak dapat diubah.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Tracking Number for shipped status */}
                {order.status === 'processing' && (
                    <div className="space-y-2">
                        <Label htmlFor="tracking">Nomor Resi</Label>
                        <div className="flex gap-2">
                            <Input
                                id="tracking"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder="Masukkan nomor resi"
                            />
                        </div>
                    </div>
                )}

                {/* Admin Notes */}
                <div className="space-y-2">
                    <Label htmlFor="notes">Catatan Admin</Label>
                    <Textarea
                        id="notes"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Tambahkan catatan..."
                        rows={2}
                    />
                    {adminNotes !== (order.admin_notes || '') && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={saveAdminNotes}
                            disabled={isLoading}
                        >
                            Simpan Catatan
                        </Button>
                    )}
                </div>

                {/* Status Actions */}
                <div className="flex flex-wrap gap-2">
                    {nextStatuses.map((status) => (
                        <AlertDialog key={status}>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant={status === 'shipped' ? 'default' : 'outline'}
                                    className={status === 'shipped' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                                    disabled={isLoading}
                                >
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {statusActions[status]}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Konfirmasi Update Status</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Apakah Anda yakin ingin mengubah status pesanan menjadi{' '}
                                        <strong>{getOrderStatusInfo(status).label}</strong>?
                                        {status === 'shipped' && !trackingNumber && (
                                            <span className="block mt-2 text-yellow-600">
                                                ⚠️ Anda belum mengisi nomor resi
                                            </span>
                                        )}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => updateStatus(status)}>
                                        Ya, Update
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ))}

                    {canCancel && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isLoading}>
                                    Batalkan
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Batalkan Pesanan</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Apakah Anda yakin ingin membatalkan pesanan ini? Tindakan ini tidak dapat dibatalkan.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4">
                                    <Label htmlFor="cancelReason">Alasan Pembatalan</Label>
                                    <Textarea
                                        id="cancelReason"
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        placeholder="Masukkan alasan pembatalan..."
                                        className="mt-2"
                                    />
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Kembali</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={() => updateStatus('cancelled')}
                                    >
                                        Ya, Batalkan
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
