// @ts-nocheck
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { ProductForm } from '@/components/products/product-form';

async function getCategories() {
    const supabase = await createClient();

    const { data: categories } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');

    return categories || [];
}

export default async function NewProductPage() {
    const categories = await getCategories();

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/products">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Tambah</h1>
                </div>
            </div>

            <ProductForm categories={categories} />
        </div>
    );
}
