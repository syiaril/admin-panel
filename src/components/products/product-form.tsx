// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Upload, X, Package } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormDescription,
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
import { Category, Product, ProductImage } from '@/types/database';

const productSchema = z.object({
    name: z.string().min(1, 'Nama produk wajib diisi'),
    slug: z.string().min(1, 'Slug wajib diisi'),
    category_id: z.string().min(1, 'Kategori wajib dipilih'),
    short_description: z.string().optional(),
    description: z.string().optional(),
    price: z.coerce.number().min(0, 'Harga tidak boleh negatif'),
    compare_price: z.coerce.number().min(0).optional(),
    cost_price: z.coerce.number().min(0).optional(),
    sku: z.string().min(1, 'SKU wajib diisi'),
    barcode: z.string().optional(),
    stock: z.coerce.number().int().min(0, 'Stok tidak boleh negatif'),
    low_stock_threshold: z.coerce.number().int().min(0).default(5),
    weight: z.coerce.number().min(0).optional(),
    is_active: z.boolean().default(true),
    is_featured: z.boolean().default(false),
    is_digital: z.boolean().default(false),
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
    product?: Product & { product_images?: ProductImage[] };
    categories: Category[];
}

export function ProductForm({ product, categories }: ProductFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [images, setImages] = useState<{ id?: string; url: string; isPrimary: boolean }[]>(
        product?.product_images?.map(img => ({
            id: img.id,
            url: img.image_url,
            isPrimary: img.is_primary,
        })) || []
    );
    const [uploadingImage, setUploadingImage] = useState(false);
    const supabase = createClient();

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: product?.name || '',
            slug: product?.slug || '',
            category_id: product?.category_id || '',
            short_description: product?.short_description || '',
            description: product?.description || '',
            price: product?.price || 0,
            compare_price: product?.compare_price || 0,
            cost_price: product?.cost_price || 0,
            sku: product?.sku || '',
            barcode: product?.barcode || '',
            stock: product?.stock || 0,
            low_stock_threshold: product?.low_stock_threshold || 5,
            weight: product?.weight || 0,
            is_active: product?.is_active ?? true,
            is_featured: product?.is_featured ?? false,
            is_digital: product?.is_digital ?? false,
            meta_title: product?.meta_title || '',
            meta_description: product?.meta_description || '',
        },
    });

    const watchName = form.watch('name');

    useEffect(() => {
        if (!product && watchName) {
            form.setValue('slug', generateSlug(watchName));
        }
    }, [watchName, product, form]);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setUploadingImage(true);

        for (const file of Array.from(files)) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('images')
                .upload(filePath, file);

            if (uploadError) {
                toast.error(`Gagal upload ${file.name}`, {
                    description: uploadError.message,
                });
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            setImages(prev => [
                ...prev,
                { url: publicUrl, isPrimary: prev.length === 0 },
            ]);
        }

        setUploadingImage(false);
        event.target.value = '';
    };

    const removeImage = (index: number) => {
        setImages(prev => {
            const newImages = [...prev];
            const removed = newImages.splice(index, 1);
            // If removed was primary, make first image primary
            if (removed[0].isPrimary && newImages.length > 0) {
                newImages[0].isPrimary = true;
            }
            return newImages;
        });
    };

    const setPrimaryImage = (index: number) => {
        setImages(prev =>
            prev.map((img, i) => ({
                ...img,
                isPrimary: i === index,
            }))
        );
    };

    async function onSubmit(data: ProductFormValues) {
        setIsLoading(true);

        try {
            if (product) {
                // Update existing product
                const { error } = await supabase
                    .from('products')
                    .update({
                        ...data,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', product.id);

                if (error) throw error;

                // Update images
                // Delete removed images
                const existingIds = images.filter(img => img.id).map(img => img.id);
                const deletedImages = product.product_images?.filter(img => !existingIds.includes(img.id)) || [];

                for (const img of deletedImages) {
                    await supabase.from('product_images').delete().eq('id', img.id);
                }

                // Update/insert images
                for (let i = 0; i < images.length; i++) {
                    const img = images[i];
                    if (img.id) {
                        await supabase
                            .from('product_images')
                            .update({
                                is_primary: img.isPrimary,
                                sort_order: i,
                            })
                            .eq('id', img.id);
                    } else {
                        await supabase.from('product_images').insert({
                            product_id: product.id,
                            image_url: img.url,
                            is_primary: img.isPrimary,
                            sort_order: i,
                        });
                    }
                }

                toast.success('Produk berhasil diupdate');
            } else {
                // Create new product
                const { data: newProduct, error } = await supabase
                    .from('products')
                    .insert(data)
                    .select()
                    .single();

                if (error) throw error;

                // Insert images
                for (let i = 0; i < images.length; i++) {
                    const img = images[i];
                    await supabase.from('product_images').insert({
                        product_id: newProduct.id,
                        image_url: img.url,
                        is_primary: img.isPrimary,
                        sort_order: i,
                    });
                }

                toast.success('Produk berhasil ditambahkan');
            }

            router.push('/products');
            router.refresh();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Terjadi kesalahan';
            toast.error('Gagal menyimpan produk', {
                description: message,
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Produk</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nama Produk *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contoh: Seragam Pramuka Siaga" {...field} />
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
                                                <Input placeholder="seragam-pramuka-siaga" {...field} />
                                            </FormControl>
                                            <FormDescription>URL-friendly version of the name</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="category_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kategori *</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Pilih kategori" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.map((cat) => (
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
                                    name="short_description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Deskripsi Singkat</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Deskripsi singkat produk..."
                                                    rows={2}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Deskripsi Lengkap</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Deskripsi lengkap produk..."
                                                    rows={5}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        {/* Images */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Gambar Produk</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    {images.map((img, index) => (
                                        <div
                                            key={index}
                                            className={`relative aspect-square rounded-lg overflow-hidden border-2 ${img.isPrimary ? 'border-orange-500' : 'border-muted'
                                                }`}
                                        >
                                            <img
                                                src={img.url}
                                                alt={`Product ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                {!img.isPrimary && (
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="secondary"
                                                        onClick={() => setPrimaryImage(index)}
                                                    >
                                                        Utama
                                                    </Button>
                                                )}
                                                <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="destructive"
                                                    onClick={() => removeImage(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            {img.isPrimary && (
                                                <span className="absolute top-1 left-1 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded">
                                                    Utama
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            disabled={uploadingImage}
                                        />
                                        {uploadingImage ? (
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        ) : (
                                            <>
                                                <Upload className="h-8 w-8 text-muted-foreground" />
                                                <span className="text-xs text-muted-foreground mt-2">Upload</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Klik gambar untuk set sebagai utama atau hapus. Gambar pertama akan menjadi utama secara default.
                                </p>
                            </CardContent>
                        </Card>

                        {/* Pricing */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Harga & Stok</CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Harga Jual (Rp) *</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="compare_price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Harga Coret (Rp)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
                                            </FormControl>
                                            <FormDescription>Harga sebelum diskon</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="cost_price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Harga Modal (Rp)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="stock"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Stok *</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="low_stock_threshold"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Batas Stok Rendah</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="5" {...field} />
                                            </FormControl>
                                            <FormDescription>Peringatan jika stok di bawah</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="weight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Berat (gram)</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="0" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>SKU & Barcode</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="sku"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SKU *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="SRG-001" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="barcode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Barcode</FormLabel>
                                            <FormControl>
                                                <Input placeholder="1234567890123" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Status Produk</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel>Aktif</FormLabel>
                                                <FormDescription>
                                                    Produk dapat dilihat pelanggan
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="is_featured"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel>Featured</FormLabel>
                                                <FormDescription>
                                                    Tampilkan di halaman utama
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="is_digital"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel>Digital</FormLabel>
                                                <FormDescription>
                                                    Produk tidak perlu pengiriman
                                                </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>SEO</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="meta_title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Meta Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Judul untuk SEO" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="meta_description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Meta Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Deskripsi untuk SEO"
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button type="submit" disabled={isLoading} className="bg-orange-500 hover:bg-orange-600">
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {product ? 'Update Produk' : 'Tambah Produk'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Batal
                    </Button>
                </div>
            </form>
        </Form>
    );
}
