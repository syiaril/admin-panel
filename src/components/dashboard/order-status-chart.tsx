// @ts-nocheck
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Label,
} from 'recharts';

import { useLanguage } from '../layout/language-provider';

interface OrderStatusChartProps {
    data: {
        name: string;
        value: number;
        color: string;
    }[];
}

export function OrderStatusChart({ data }: OrderStatusChartProps) {
    const { t } = useLanguage();
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <Card className="py-4 gap-0 flex flex-col h-full">
            <CardHeader className="px-6 py-0 mb-2">
                <CardTitle className="text-base font-semibold">{t('orderStatus')}</CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-0 flex-1 flex flex-col justify-center">
                <div className="h-[220px] w-full min-w-0 mb-4">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={90}
                                paddingAngle={5}
                                cornerRadius={6}
                                dataKey="value"
                                labelLine={false}
                                label={false}
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                        stroke="transparent"
                                        className="outline-none focus:outline-none"
                                    />
                                ))}
                                <Label
                                    value={`${total}`}
                                    position="center"
                                    className="fill-foreground font-bold text-2xl"
                                />
                                <Label
                                    value={t('totalOrders')}
                                    position="center"
                                    dy={20}
                                    className="fill-muted-foreground text-[10px]"
                                />
                            </Pie>
                            <Tooltip
                                formatter={(value: number, name: string) => [`${value} ${t('orders')}`, t(name as any)]}
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
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-auto">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1.5 truncate">
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-muted-foreground truncate">{t(item.name as any)}</span>
                            </div>
                            <span className="font-medium ml-1 text-foreground">
                                {((item.value / total) * 100).toFixed(0)}%
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
