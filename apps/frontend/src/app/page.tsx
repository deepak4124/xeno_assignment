'use client';

import MetricCards from '@/components/MetricCards';
import SyncController from '@/components/SyncController';
import LiveEventTerminal from '@/components/LiveEventTerminal';
import CustomerRFMChart from '@/components/CustomerRFMChart';
import OrdersTrendChart from '@/components/OrdersTrendChart';
import TenantManager from '@/components/TenantManager';
import { TenantProvider } from '@/lib/TenantContext';
import { LayoutDashboard } from 'lucide-react';

export default function Home() {
  return (
    <TenantProvider>
      <div className="min-h-screen bg-black text-zinc-50 flex">
        {/* Sidebar */}
        <aside className="w-64 border-r border-zinc-800 p-6 hidden md:block">
          <div className="mb-8 flex items-center space-x-2">
            <div className="h-6 w-6 bg-white rounded-full" />
            <span className="font-bold text-lg tracking-tight">XENO_INGEST</span>
          </div>
          
          <nav className="space-y-2">
            <a href="#" className="flex items-center space-x-3 px-3 py-2 bg-zinc-900 rounded-md text-sm font-medium">
              <LayoutDashboard className="h-4 w-4" />
              <span>Dashboard</span>
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto h-screen">
          <div className="max-w-6xl mx-auto space-y-8">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
              <div className="flex items-center space-x-4">
                <TenantManager />
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-zinc-400 font-mono">SYSTEM_ONLINE</span>
                </div>
              </div>
            </div>

            {/* Row 1: Metrics */}
            <MetricCards />

            {/* Row 2: Trend & Sync */}
            <div className="grid gap-4 md:grid-cols-3 h-[350px]">
              <div className="md:col-span-2 h-full">
                <OrdersTrendChart />
              </div>
              <div className="md:col-span-1 h-full">
                <SyncController />
              </div>
            </div>

            {/* Row 3: Top Customers */}
            <div className="h-[300px]">
              <CustomerRFMChart />
            </div>

            {/* Row 4: Terminal */}
            <div className="h-[400px]">
              <LiveEventTerminal />
            </div>

          </div>
        </main>
      </div>
    </TenantProvider>
  );
}

