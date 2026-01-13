// @ts-nocheck
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

interface QuickStockEditProps {
    productId: string;
    currentStock: number;
}

export function QuickStockEdit({ productId, currentStock }: QuickStockEditProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [stock, setStock] = useState(currentStock);
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const handleSave = async () => {
        setIsLoading(true);

        const { error } = await supabase
            .from('products')
            .update({ stock, updated_at: new Date().toISOString() })
            .eq('id', productId);

        if (error) {
            toast.error('Gagal update stok', { description: error.message });
        } else {
            toast.success('Stok berhasil diupdate');
            router.refresh();
        }

        setIsLoading(false);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setStock(currentStock);
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1">
                <Input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-20 h-8 text-center"
                    min={0}
                    autoFocus
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-green-600"
                    onClick={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600"
                    onClick={handleCancel}
                    disabled={isLoading}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setIsEditing(true)}
            className="text-sm font-medium hover:underline cursor-pointer"
        >
            {currentStock}
        </button>
    );
}
