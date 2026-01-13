// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { generateSlug } from '@/lib/formatters';
import { Category } from '@/types/database';

const categorySchema = z.object({
    name: z.string().min(1, 'Nama kategori wajib diisi'),
    slug: z.string().min(1, 'Slug wajib diisi'),
    description: z.string().optional(),
    parent_id: z.string().optional(),
    is_active: z.boolean().default(true),
    sort_order: z.coerce.number().int().min(0).default(0),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
    category?: Category;
    categories: Category[];
}

export function CategoryForm({ category, categories }: CategoryFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: category?.name || '',
            slug: category?.slug || '',
            description: category?.description || '',
            parent_id: category?.parent_id || '',
            is_active: category?.is_active ?? true,
            sort_order: category?.sort_order || 0,
        },
    });

    const watchName = form.watch('name');

    useEffect(() => {
        if (!category && watchName) {
            form.setValue('slug', generateSlug(watchName));
        }
    }, [watchName, category, form]);

    async function onSubmit(data: CategoryFormValues) {
        setIsLoading(true);

        try {
            const categoryData = {
                ...data,
                parent_id: data.parent_id || null,
            };

            if (category) {
                const { error } = await supabase
                    .from('categories')
                    .update({
                        ...categoryData,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', category.id);

                if (error) throw error;
                toast.success('Kategori berhasil diupdate');
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert(categoryData);

                if (error) throw error;
                toast.success('Kategori berhasil ditambahkan');
            }

            router.refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
            toast.error('Gagal menyimpan kategori', {
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
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nama Kategori *</FormLabel>
                            <FormControl>
                                <Input placeholder="Contoh: Seragam" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Slug *</FormLabel>
                            <FormControl>
                                <Input placeholder="seragam" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="parent_id"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Parent Kategori</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih parent (opsional)" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="">Tidak ada</SelectItem>
                                    {categories
                                        .filter(c => !c.parent_id)
                                        .map((cat) => (
                                            <SelectItem key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Deskripsi</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder="Deskripsi kategori..."
                                    rows={3}
                                    {...field}
                                />
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
                        {category ? 'Update' : 'Tambah'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
