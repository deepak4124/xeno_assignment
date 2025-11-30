'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './api';

interface Tenant {
  id: string;
  shopDomain: string;
  createdAt: string;
}

interface TenantContextType {
  tenants: Tenant[];
  selectedTenant: Tenant | null;
  setSelectedTenant: (tenant: Tenant) => void;
  refreshTenants: () => Promise<void>;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshTenants = async () => {
    try {
      // We need basic auth to list tenants. For the frontend demo, 
      // we might need to prompt for it or hardcode it for the "demo" experience.
      // For now, let's assume the user provides it via a prompt or we use a default if in dev.
      // Ideally, this should be a proper login flow.
      
      // For this assignment, I'll use a simple prompt-based approach in the UI, 
      // but for the initial load, we might fail if not authenticated.
      // Let's try to fetch without auth first (which will fail), 
      // or we can just store the credentials in localStorage if the user "logs in".
      
      const auth = localStorage.getItem('admin_auth');
      if (!auth) {
        setIsLoading(false);
        return;
      }

      const res = await api.get('/tenants', {
        headers: { Authorization: `Basic ${auth}` }
      });
      
      setTenants(res.data);
      
      // Select first tenant by default if none selected
      if (!selectedTenant && res.data.length > 0) {
        setSelectedTenant(res.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch tenants', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshTenants();
  }, []);

  return (
    <TenantContext.Provider value={{ tenants, selectedTenant, setSelectedTenant, refreshTenants, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}
