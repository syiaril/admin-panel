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
import { useLanguage } from '@/components/layout/language-provider';

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

interface OrderStatusUpdaterProps {
    order: Order;
    onUpdate?: () => void;
}

export function OrderStatusUpdater({ order, onUpdate }: OrderStatusUpdaterProps) {
    const { t } = useLanguage();
    const [isLoading, setIsLoading] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
    const [adminNotes, setAdminNotes] = useState(order.admin_notes || '');
    const [cancelReason, setCancelReason] = useState('');

    const statusActions: Record<OrderStatus, string> = {
        confirmed: t('action_confirm'),
        processing: t('action_process'),
        shipped: t('action_ship'),
        delivered: t('action_mark_delivered'),
        completed: t('action_complete'),
        cancelled: t('action_cancel'),
        refunded: t('action_refund'),
        pending: t('status_pending'),
    };

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
                toast.success(t('statusUpdateSuccess'), {
                    description: `${t('orders')} ${order.order_number} ${t('status')} ${getOrderStatusInfo(newStatus, t).label}`,
                });
                onUpdate?.();
            } else {
                throw new Error(response.error || t('statusUpdateError'));
            }
        } catch (err) {
            toast.error(t('statusUpdateError'), {
                description: err instanceof Error ? err.message : t('loading'),
            });
        } finally {
            setIsLoading(false);
        }
    };

    const saveTrackingNumber = async () => {
        if (!trackingNumber.trim()) {
            toast.error(t('trackingEmptyError'));
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
                toast.success(t('trackingSaveSuccess'));
                onUpdate?.();
            } else {
                throw new Error(response.error || t('trackingSaveError'));
            }
        } catch (err) {
            toast.error(t('trackingSaveError'), {
                description: err instanceof Error ? err.message : t('loading'),
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
                toast.success(t('notesSaveSuccess'));
                onUpdate?.();
            } else {
                throw new Error(response.error || t('notesSaveError'));
            }
        } catch (err) {
            toast.error(t('notesSaveError'), {
                description: err instanceof Error ? err.message : t('loading'),
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (nextStatuses.length === 0 && !canCancel) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('updateStatus')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {t('orderFixedStatus').replace('{0}', getOrderStatusInfo(order.status, t).label.toLowerCase())}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('updateStatus')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Tracking Number for shipped status */}
                {order.status === 'processing' && (
                    <div className="space-y-2">
                        <Label htmlFor="tracking">{t('trackingNumber')}</Label>
                        <div className="flex gap-2">
                            <Input
                                id="tracking"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                placeholder={t('enterTrackingNumber')}
                            />
                        </div>
                    </div>
                )}

                {/* Admin Notes */}
                <div className="space-y-2">
                    <Label htmlFor="notes">{t('adminNotes')}</Label>
                    <Textarea
                        id="notes"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder={t('adminNotesPlaceholder')}
                        rows={2}
                    />
                    {adminNotes !== (order.admin_notes || '') && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={saveAdminNotes}
                            disabled={isLoading}
                        >
                            {t('saveNotes')}
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
                                    <AlertDialogTitle>{t('confirmUpdateTitle')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t('confirmUpdateDesc')}{' '}
                                        <strong>{getOrderStatusInfo(status, t).label}</strong>?
                                        {status === 'shipped' && !trackingNumber && (
                                            <span className="block mt-2 text-yellow-600">
                                                ⚠️ {t('noTrackingWarning')}
                                            </span>
                                        )}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => updateStatus(status)}>
                                        {t('yesUpdate')}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ))}

                    {canCancel && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" disabled={isLoading}>
                                    {t('cancelOrder')}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{t('cancelOrder')}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {t('cancelConfirm')}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="py-4">
                                    <Label htmlFor="cancelReason">{t('cancelReason')}</Label>
                                    <Textarea
                                        id="cancelReason"
                                        value={cancelReason}
                                        onChange={(e) => setCancelReason(e.target.value)}
                                        placeholder={t('enterCancelReason')}
                                        className="mt-2"
                                    />
                                </div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                                    <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={() => updateStatus('cancelled')}
                                    >
                                        {t('yesCancel')}
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
