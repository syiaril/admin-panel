// @ts-nocheck
'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { useLanguage } from '@/components/layout/language-provider';

interface CategoryFormProps {
    category?: Category;
    categories: Category[];
}

export function CategoryForm({ category, categories }: CategoryFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();
    const { t } = useLanguage();

    const categorySchema = useMemo(() => z.object({
        name: z.string().min(1, t('categoryNameRequired')),
        slug: z.string().min(1, t('slugRequired')),
        description: z.string().optional(),
        parent_id: z.string().optional(),
        is_active: z.boolean().default(true),
        sort_order: z.coerce.number().int().min(0).default(0),
    }), [t]);

    type CategoryFormValues = z.infer<typeof categorySchema>;

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
                toast.success(t('categoryUpdateSuccess'));
            } else {
                const { error } = await supabase
                    .from('categories')
                    .insert(categoryData);

                if (error) throw error;
                toast.success(t('categoryAddSuccess'));
            }

            router.refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : t('errorLoadingDetails');
            toast.error(t('categorySaveError'), {
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
                            <FormLabel>{t('categoryNameLabel')} *</FormLabel>
                            <FormControl>
                                <Input placeholder={t('exampleUniform')} {...field} />
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
                            <FormLabel>{t('slug')} *</FormLabel>
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
                            <FormLabel>{t('parentCategoryLabel')}</FormLabel>
                            <Select onValueChange={(value) => field.onChange(value === "none" ? "" : value)} defaultValue={field.value || "none"}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectParentOptional')} />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="none">{t('none')}</SelectItem>
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
                            <FormLabel>{t('descriptionLabel')}</FormLabel>
                            <FormControl>
                                <Textarea
                                    placeholder={t('categoryDescPlaceholder')}
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
                            <FormLabel>{t('sortOrderLabel')}</FormLabel>
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
                                <FormLabel>{t('activeLabel')}</FormLabel>
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
                        {category ? t('save') : t('add')}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
