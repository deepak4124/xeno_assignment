"use client";

import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { useTenant } from '@/lib/TenantContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Package } from 'lucide-react';

export default function MetricCards() {
  const { selectedTenant } = useTenant();
  const { data, error } = useSWR(
    selectedTenant ? `/stats?shopDomain=${selectedTenant.shopDomain}` : null, 
    fetcher, 
    { refreshInterval: 5000 }
  );

  const getValue = (val: any, formatter: (v: any) => string = (v) => v) => {
    if (!selectedTenant) return "Select Tenant";
    if (!data) return "Loading...";
    return formatter(val);
  };

  const metrics = [
    {
      title: "Total Revenue",
      value: getValue(data?.totalRevenue, (v) => `$${v.toLocaleString()}`),
      change: "Real-time data",
      icon: DollarSign,
    },
    {
      title: "Active Customers",
      value: getValue(data?.activeCustomers, (v) => v.toLocaleString()),
      change: "Real-time data",
      icon: Users,
    },
    {
      title: "Total Orders",
      value: getValue(data?.totalOrders, (v) => v.toLocaleString()),
      change: "Real-time data",
      icon: Package,
    },
    {
      title: "Abandoned Revenue",
      value: getValue(data?.abandonedRevenue, (v) => `$${v?.toLocaleString() || '0'}`),
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
