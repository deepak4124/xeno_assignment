"use client";

import useSWR from 'swr';
import { fetcher } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Terminal } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTenant } from '@/lib/TenantContext';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

export default function LiveEventTerminal() {
  const { selectedTenant } = useTenant();
  const { data } = useSWR(
    selectedTenant ? `/sync-status?shopDomain=${selectedTenant.shopDomain}` : null, 
    fetcher, 
    { refreshInterval: 2000 }
  );
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data) {
      const formattedLogs = data.map((log: any) => ({
        timestamp: new Date(log.createdAt).toLocaleTimeString(),
        message: log.message,
        type: log.level.toLowerCase() === 'error' ? 'warning' : log.level.toLowerCase()
      })).reverse(); // Show newest at bottom
      setLogs(formattedLogs);
    }
  }, [data]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <Card className="h-full flex flex-col bg-black border-zinc-800">
      <CardHeader className="border-b border-zinc-800 py-3">
        <CardTitle className="flex items-center text-sm font-mono text-zinc-400">
          <Terminal className="mr-2 h-4 w-4" />
          LIVE_EVENT_STREAM
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <div 
          ref={scrollRef}
          className="h-full overflow-y-auto p-4 font-mono text-xs space-y-1"
        >
          {logs.map((log, i) => (
            <div key={i} className="flex">
              <span className="text-zinc-500 mr-3">[{log.timestamp}]</span>
              <span className={
                log.type === 'success' ? 'text-green-400' :
                log.type === 'warning' ? 'text-yellow-400' :
                'text-zinc-300'
              }>
                {log.message}
              </span>
            </div>
          ))}
          <div className="animate-pulse text-green-500">_</div>
        </div>
      </CardContent>
    </Card>
  );
}
