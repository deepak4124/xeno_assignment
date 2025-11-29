"use client";

import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Package } from 'lucide-react';

export default function MetricCards() {
  const { data, error } = useSWR('/stats', fetcher, { refreshInterval: 5000 });

  const metrics = [
    {
      title: "Total Revenue",
      value: data ? `$${data.totalRevenue.toLocaleString()}` : "Loading...",
      change: "Real-time data",
      icon: DollarSign,
    },
    {
      title: "Active Customers",
      value: data ? data.activeCustomers.toLocaleString() : "Loading...",
      change: "Real-time data",
      icon: Users,
    },
    {
      title: "Total Orders",
      value: data ? data.totalOrders.toLocaleString() : "Loading...",
      change: "Real-time data",
      icon: Package,
    },
    {
      title: "Abandoned Revenue",
      value: data ? `$${data.abandonedRevenue?.toLocaleString() || '0'}` : "Loading...",
      change: "Potential Revenue",
      icon: DollarSign,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-zinc-400">
              {metric.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
