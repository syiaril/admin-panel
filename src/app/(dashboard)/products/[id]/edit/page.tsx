// @ts-nocheck
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { ProductForm } from '@/components/products/product-form';

async function getProduct(id: string) {
    const supabase = await createClient();

    const { data: product, error } = await supabase
        .from('products')
        .select(`
      *,
      product_images (
        id,
        image_url,
        alt_text,
        is_primary,
        sort_order
      )
    `)
        .eq('id', id)
        .single();

    if (error || !product) {
        return null;
    }

    return product;
}

async function getCategories() {
    const supabase = await createClient();

    const { data: categories } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');

    return categories || [];
}

export default async function EditProductPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const [product, categories] = await Promise.all([
        getProduct(id),
        getCategories(),
    ]);

    if (!product) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/products">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Edit Produk</h1>
                    <p className="text-muted-foreground">{product.name}</p>
                </div>
            </div>

            <ProductForm product={product} categories={categories} />
        </div>
    );
}
