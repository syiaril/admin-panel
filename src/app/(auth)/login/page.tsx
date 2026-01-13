'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

const loginSchema = z.object({
    email: z.string().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const error = searchParams.get('error');
    const redirect = searchParams.get('redirect') || '/dashboard';

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });

    async function onSubmit(data: LoginFormValues) {
        setIsLoading(true);

        try {
            // Sign in with Supabase
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password,
            });

            if (authError) {
                toast.error('Login gagal', {
                    description: authError.message === 'Invalid login credentials'
                        ? 'Email atau password salah'
                        : authError.message,
                });
                setIsLoading(false);
                return;
            }

            if (!authData.user) {
                toast.error('Login gagal', {
                    description: 'Tidak dapat memverifikasi user',
                });
                setIsLoading(false);
                return;
            }

            // Check if user is admin
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role, full_name')
                .eq('id', authData.user.id)
                .single();

            if (profileError || !profile) {
                toast.error('Login gagal', {
                    description: 'Tidak dapat memverifikasi profil user',
                });
                await supabase.auth.signOut();
                setIsLoading(false);
                return;
            }

            if (profile.role !== 'admin') {
                toast.error('Akses ditolak', {
                    description: 'Hanya admin yang dapat mengakses panel ini',
                });
                await supabase.auth.signOut();
                setIsLoading(false);
                return;
            }

            toast.success('Login berhasil', {
                description: `Selamat datang, ${profile.full_name || 'Admin'}!`,
            });

            router.push(redirect);
            router.refresh();
        } catch {
            toast.error('Terjadi kesalahan', {
                description: 'Silakan coba lagi nanti',
            });
            setIsLoading(false);
        }
    }

    return (
        <Card className="w-full max-w-md mx-4 shadow-xl">
            <CardHeader className="space-y-1 text-center">
                <div className="flex justify-center mb-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 text-white text-2xl font-bold">
                        KS
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold">Kedai Species</CardTitle>
                <CardDescription>
                    Masuk ke admin panel untuk mengelola toko
                </CardDescription>
            </CardHeader>
            <CardContent>
                {error === 'unauthorized' && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                        Anda tidak memiliki akses ke halaman ini. Silakan login dengan akun admin.
                    </div>
                )}

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="admin@kedaispecies.com"
                                            type="email"
                                            autoComplete="email"
                                            disabled={isLoading}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="••••••••"
                                            type="password"
                                            autoComplete="current-password"
                                            disabled={isLoading}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-orange-500 hover:bg-orange-600"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Masuk
                        </Button>
                    </form>
                </Form>
            </CardContent>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                    Belum punya akun?{' '}
                    <Link href="/register" className="text-orange-600 hover:text-orange-500 font-medium">
                        Daftar
                    </Link>
                </p>
            </CardFooter>
        </Card >
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
