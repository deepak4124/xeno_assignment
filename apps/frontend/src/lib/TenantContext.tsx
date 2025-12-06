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
      // Fetch tenants without legacy basic auth
      const res = await api.get('/tenants');
      
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
