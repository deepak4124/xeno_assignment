"use client";

import { useState } from 'react';
import api from '@/lib/api';
import { useTenant } from '@/lib/TenantContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Play } from 'lucide-react';

export default function SyncController() {
  const { selectedTenant } = useTenant();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!selectedTenant) return;
    
    setIsSyncing(true);
    try {
      await api.post('/sync', { shopDomain: selectedTenant.shopDomain });
    } catch (error) {
      console.error('Sync failed', error);
    } finally {
      // Optimistic UI: Keep loading state for 5 seconds to show "activity"
      setTimeout(() => setIsSyncing(false), 5000);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Sync Control</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center h-[200px] space-y-4">
        <div className="text-center space-y-2">
          <p className="text-sm text-zinc-400">
            Trigger a manual data synchronization for {selectedTenant?.shopDomain || 'selected tenant'}.
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleSync}
          disabled={isSyncing || !selectedTenant}
          className="w-full max-w-xs"
        >
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Syncing Data...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Data Sync
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
