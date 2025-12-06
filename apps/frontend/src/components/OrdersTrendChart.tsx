"use client";

import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { useTenant } from '@/lib/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function OrdersTrendChart() {
  const { selectedTenant } = useTenant();
  const [range, setRange] = useState('7'); // 7, 30, or 'all'

  const getDates = () => {
    if (range === 'all') return '';
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(range));
    return `&startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
  };

  const { data } = useSWR(
    selectedTenant ? `/orders-trend?shopDomain=${selectedTenant.shopDomain}${getDates()}` : null, 
    fetcher
  );

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Orders Trend</CardTitle>
        <select 
          className="bg-zinc-900 border border-zinc-800 text-sm rounded-md px-2 py-1 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700"
          value={range}
          onChange={(e) => setRange(e.target.value)}
        >
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="all">All Time</option>
        </select>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data || []}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#fff" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#fff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#888888" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(str) => {
                const date = new Date(str);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              cursor={{stroke: '#666', strokeWidth: 1}}
              contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="#fff" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorTotal)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
