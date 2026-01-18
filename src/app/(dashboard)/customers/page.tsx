import { Suspense } from 'react';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Eye, Users, Mail, Phone, ShoppingBag } from 'lucide-react';
import { formatDate, getInitials } from '@/lib/formatters';
import { Profile } from '@/types/database';

interface ProfileWithOrderCount extends Profile {
    orders: { count: number }[];
}

async function getCustomers() {
    const supabase = createAdminClient();

    const { data: customers, error } = await supabase
        .from('profiles')
        .select(`
      *,
      orders (count)
    `)
        .eq('role', 'customer')
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching customers:', error);
        return [];
    }

    return customers as ProfileWithOrderCount[];
}

async function getCustomerStats() {
    const supabase = createAdminClient();

    const { count: total } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer');

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { count: newThisMonth } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer')
        .gte('created_at', startOfMonth.toISOString());

    const { count: verified } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer')
        .eq('is_verified', true);

    return {
        total: total || 0,
        newThisMonth: newThisMonth || 0,
        verified: verified || 0,
    };
}

function CustomersTableSkeleton() {
    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        {['Pelanggan', 'Email', 'Telepon', 'Pesanan', 'Status', 'Bergabung', ''].map((h, i) => (
                            <TableHead key={i}>{h}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                            </TableCell>
                            <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

async function CustomersTable() {
    const customers = await getCustomers();

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Pelanggan</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telepon</TableHead>
                        <TableHead className="text-center">Pesanan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Bergabung</TableHead>
                        <TableHead className="w-10"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customers.length > 0 ? (
                        customers.map((customer) => {
                            const orderCount = customer.orders?.[0]?.count || 0;

                            return (
                                <TableRow key={customer.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={customer.avatar_url || undefined} />
                                                <AvatarFallback className="bg-orange-100 text-orange-600">
                                                    {getInitials(customer.full_name || customer.email)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">
                                                {customer.full_name || 'Tanpa nama'}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {customer.email}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {customer.phone || '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline">
                                            <ShoppingBag className="h-3 w-3 mr-1" />
                                            {orderCount}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={customer.is_verified ? 'default' : 'secondary'}>
                                            {customer.is_verified ? 'Terverifikasi' : 'Belum Verifikasi'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {formatDate(customer.created_at)}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                            <Link href={`/customers/${customer.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                                <div className="flex flex-col items-center gap-2">
                                    <Users className="h-8 w-8 text-muted-foreground" />
                                    <p className="text-muted-foreground">Belum ada pelanggan</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

async function StatsCards() {
    const stats = await getCustomerStats();

    return (
        <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <p className="text-xs text-muted-foreground">Total Pelanggan</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-green-600">{stats.newThisMonth}</div>
                    <p className="text-xs text-muted-foreground">Baru Bulan Ini</p>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="pt-4">
                    <div className="text-2xl font-bold text-blue-600">{stats.verified}</div>
                    <p className="text-xs text-muted-foreground">Terverifikasi</p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function CustomersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Pelanggan</h1>
                <p className="text-muted-foreground">
                    Kelola data pelanggan toko
                </p>
            </div>

            <Suspense fallback={
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardContent className="pt-4">
                                <Skeleton className="h-8 w-12 mb-1" />
                                <Skeleton className="h-3 w-24" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            }>
                <StatsCards />
            </Suspense>

            <Suspense fallback={<CustomersTableSkeleton />}>
                <CustomersTable />
            </Suspense>
        </div>
    );
}
