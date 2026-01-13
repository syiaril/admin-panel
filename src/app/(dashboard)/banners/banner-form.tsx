// @ts-nocheck
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import { Banner } from '@/types/database';

const bannerSchema = z.object({
    title: z.string().min(1, 'Judul wajib diisi'),
    image_url: z.string().url('URL gambar tidak valid').optional().or(z.literal('')),
    link_url: z.string().url('URL link tidak valid').optional().or(z.literal('')),
    is_active: z.boolean().default(true),
    sort_order: z.coerce.number().int().min(0).default(0),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

interface BannerFormProps {
    banner?: Banner;
}

export function BannerForm({ banner }: BannerFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(banner?.image_url || '');
    const supabase = createClient();

    const form = useForm<BannerFormValues>({
        resolver: zodResolver(bannerSchema),
        defaultValues: {
            title: banner?.title || '',
            image_url: banner?.image_url || '',
            link_url: banner?.link_url || '',
            is_active: banner?.is_active ?? true,
            sort_order: banner?.sort_order || 0,
        },
    });

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `banners/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file);

        if (uploadError) {
            toast.error('Gagal upload gambar', {
                description: uploadError.message,
            });
            setUploadingImage(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);

        form.setValue('image_url', publicUrl);
        setPreviewUrl(publicUrl);
        setUploadingImage(false);
        event.target.value = '';
    };

    async function onSubmit(data: BannerFormValues) {
        setIsLoading(true);

        try {
            if (banner) {
                const { error } = await supabase
                    .from('banners')
                    .update({
                        ...data,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', banner.id);

                if (error) throw error;
                toast.success('Banner berhasil diupdate');
            } else {
                const { error } = await supabase
                    .from('banners')
                    .insert(data);

                if (error) throw error;
                toast.success('Banner berhasil ditambahkan');
            }

            router.refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
            toast.error('Gagal menyimpan banner', {
                description: message,
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Judul *</FormLabel>
                            <FormControl>
                                <Input placeholder="Contoh: Promo Akhir Tahun" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="space-y-2">
                    <FormLabel>Gambar Banner</FormLabel>
                    {previewUrl && (
                        <div className="w-full h-32 rounded overflow-hidden bg-muted mb-2">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-muted-foreground/50">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploadingImage}
                        />
                        {uploadingImage ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <Upload className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Upload gambar</span>
                            </>
                        )}
                    </label>
                </div>

                <FormField
                    control={form.control}
                    name="link_url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Link URL</FormLabel>
                            <FormControl>
                                <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="sort_order"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Urutan</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                                <FormLabel>Aktif</FormLabel>
                            </div>
                            <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={isLoading} className="bg-orange-500 hover:bg-orange-600">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {banner ? 'Update' : 'Tambah'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
