'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

import { useLanguage } from '../layout/language-provider';

interface TopProductsChartProps {
    data: {
        name: string;
        sold: number;
    }[];
}

export function TopProductsChart({ data }: TopProductsChartProps) {
    const { t } = useLanguage();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Card className="py-4 gap-0">
                <CardHeader className="px-6 py-0 mb-4">
                    <CardTitle className="text-base font-semibold">Produk Terlaris</CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-0">
                    <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-lg" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="py-4 gap-0 h-full flex flex-col">
            <CardHeader className="px-6 py-0 mb-4">
                <CardTitle className="text-base font-semibold">{t('topProducts')}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-0 flex-1">
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <BarChart data={data} layout="vertical" margin={{ left: -20, right: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                            <XAxis
                                type="number"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis
                                dataKey="name"
                                type="category"
                                width={120}
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                tickFormatter={(value) =>
                                    value.length > 20 ? `${value.substring(0, 20)}...` : value
                                }
                            />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                                formatter={(value: number | undefined) => [`${value || 0} ${t('sold')}`, t('products')]}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                    color: 'hsl(var(--foreground))',
                                }}
                                itemStyle={{ color: 'hsl(var(--foreground))' }}
                                labelStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Bar dataKey="sold" fill="#FB6600" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
