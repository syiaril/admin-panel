'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client'; // Use the project's client creator
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function SetupAdminPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
    });

    const supabase = createClient();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                    },
                },
            });

            if (authError) throw authError;

            if (!authData.user) {
                throw new Error('User creation failed (no user returned)');
            }

            // 2. Update Profile to Admin
            // Note: This might fail if RLS policies are strict. 
            // Usually, a user can update their own profile, but changing 'role' might be restricted.
            // We'll try it.
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    role: 'admin',
                    full_name: formData.fullName
                })
                .eq('id', authData.user.id);

            if (updateError) {
                console.error('Profile update error:', updateError);
                toast.error('User created, but failed to make Admin (RLS restricted?)');
                return;
            }

            toast.success('Admin user created successfully!');

            // 3. Auto login (signUp typically works, but if email confirm is on, it might not)
            // If session exists, we redirect.
            if (authData.session) {
                router.push('/dashboard');
            } else {
                toast.info('Please check email for confirmation link if enabled.');
                router.push('/login');
            }

        } catch (error: any) {
            console.error('Error:', error);
            toast.error(error.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Setup Admin User</CardTitle>
                    <CardDescription>
                        Create a new user and attempt to promote to Admin.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="admin@example.com"
                                required
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="******"
                                required
                                minLength={6}
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input
                                id="fullName"
                                name="fullName"
                                placeholder="System Admin"
                                required
                                value={formData.fullName}
                                onChange={handleChange}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Admin Account'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
