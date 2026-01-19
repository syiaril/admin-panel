'use client';

import { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { useLanguage } from '../layout/language-provider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Calendar } from 'lucide-react';

interface RevenueChartProps {
    data: {
        date: string;
        revenue: number;
    }[];
    period: string;
}

const PERIOD_LABELS: Record<string, string> = {
    '7d': '7 Hari Terakhir',
    '1m': '1 Bulan Terakhir',
    '3m': '3 Bulan Terakhir',
    '1y': '1 Tahun Terakhir',
    '3y': '3 Tahun Terakhir',
};

export function RevenueChart({ data, period }: RevenueChartProps) {
    const { language, t } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handlePeriodChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('period', value);
        router.push(`${pathname}?${params.toString()}`);
    };

    if (!mounted) {
        return (
            <Card className="py-4 gap-0">
                <CardHeader className="flex flex-row items-center justify-between px-6 py-0 mb-4 h-[40px]">
                    <CardTitle className="text-base font-semibold">{t('revenue')}</CardTitle>
                    <div className="w-32 h-8 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent className="px-6 py-0">
                    <div className="h-[300px] w-full bg-muted/20 animate-pulse rounded-lg" />
                </CardContent>
            </Card>
        );
    }

    const formatRevenue = (value: number) => {
        const locale = language === 'en' ? 'en-US' : 'id-ID';
        return new Intl.NumberFormat(locale, {
            notation: 'compact',
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 1,
        }).format(value);
    };

    const PERIOD_OPTIONS = [
        { value: '7d', labelKey: 'last7days' },
        { value: '30d', labelKey: 'last30days' },
        { value: '90d', labelKey: 'last90days' },
        { value: '1y', labelKey: 'last1year' },
    ];

    return (
        <Card className="py-4 gap-0 h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between px-6 py-0 mb-4 overflow-visible h-[40px]">
                <CardTitle className="text-base font-semibold">{t('revenue')}</CardTitle>
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Select value={period} onValueChange={handlePeriodChange}>
                        <SelectTrigger className="w-[180px] h-8 text-xs">
                            <SelectValue placeholder={t('select' as any) || 'Select...'} />
                        </SelectTrigger>
                        <SelectContent>
                            {PERIOD_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {t(opt.labelKey as any)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="px-6 py-0">
                <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                            <XAxis
                                dataKey="date"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                                tickFormatter={formatRevenue}
                            />
                            <Tooltip
                                formatter={(value: number | undefined) => {
                                    const locale = language === 'en' ? 'en-US' : 'id-ID';
                                    return new Intl.NumberFormat(locale, {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 0,
                                    }).format(value || 0)
                                }}
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    color: 'hsl(var(--foreground))',
                                    borderRadius: 'var(--radius)',
                                }}
                                itemStyle={{ color: 'currentColor' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
