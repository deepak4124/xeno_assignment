"use client";

import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { useTenant } from '@/lib/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

export default function CustomerRFMChart() {
  const { selectedTenant } = useTenant();
  const { data } = useSWR(
    selectedTenant ? `/top-customers?shopDomain=${selectedTenant.shopDomain}` : null, 
    fetcher
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Top Customers by Spending</CardTitle>
      </CardHeader>
      <CardContent className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data || []}>
            <XAxis 
              dataKey="name" 
              stroke="#888888" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              cursor={{fill: '#27272a'}}
              contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a' }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Total Spent']}
            />
            <Bar 
              dataKey="totalSpent" 
              fill="#fafafa" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
