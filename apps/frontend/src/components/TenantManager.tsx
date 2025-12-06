'use client';

import { useState } from 'react';
import { useTenant } from '@/lib/TenantContext';
import { useAuth } from '@/lib/AuthContext';
import { Plus, Check, ChevronsUpDown, LogOut, Trash2 } from 'lucide-react';
import api from '@/lib/api';

export default function TenantManager() {
  const { tenants, selectedTenant, setSelectedTenant, refreshTenants } = useTenant();
  const { signOut } = useAuth();
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);

  // Onboard State
  const [newShopDomain, setNewShopDomain] = useState('');
  const [newAccessToken, setNewAccessToken] = useState('');
  const [newWebhookSecret, setNewWebhookSecret] = useState('');

  const handleDelete = async (tenantId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) return;

    // TODO: Add proper auth check here when backend supports Supabase tokens
    // const auth = localStorage.getItem('admin_auth');
    
    try {
      await api.delete(`/tenants/${tenantId}`, {
        // headers: { Authorization: `Basic ${auth}` }
      });
      if (selectedTenant?.id === tenantId) {
        setSelectedTenant(null as any);
      }
      await refreshTenants();
    } catch (error) {
      alert('Failed to delete tenant (Auth required)');
    }
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await api.post('/tenants', {
        shopDomain: newShopDomain,
        accessToken: newAccessToken,
        webhookSecret: newWebhookSecret || undefined
      }, {
        // headers: { Authorization: `Basic ${auth}` }
      });
      await refreshTenants();
      setIsOnboardOpen(false);
      setNewShopDomain('');
      setNewAccessToken('');
      setNewWebhookSecret('');
    } catch (error) {
      alert('Failed to onboard tenant (Auth required)');
    }
  };

  return (
    <div className="flex items-center space-x-4">
      {/* Tenant Selector */}
      <div className="relative group">
        <button className="flex items-center space-x-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md min-w-[200px] justify-between">
          <span className="text-sm font-medium truncate">
            {selectedTenant?.shopDomain || 'Select Tenant'}
          </span>
          <ChevronsUpDown className="h-4 w-4 text-zinc-500" />
        </button>

        <div className="absolute top-full left-0 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl hidden group-hover:block z-50">
          {tenants.map(tenant => (
            <div
              key={tenant.id}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-zinc-800 group/item"
            >
              <button
                onClick={() => setSelectedTenant(tenant)}
                className="flex-1 text-left truncate flex items-center"
              >
                <span className="truncate mr-2">{tenant.shopDomain}</span>
                {selectedTenant?.id === tenant.id && <Check className="h-3 w-3 text-green-500" />}
              </button>
              <button
                onClick={(e) => handleDelete(tenant.id, e)}
                className="p-1 text-zinc-500 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                title="Delete Tenant"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Tenant Button */}
      <div className="relative">
        <button 
          onClick={() => setIsOnboardOpen(!isOnboardOpen)}
          className="flex items-center space-x-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Tenant</span>
        </button>

        {isOnboardOpen && (
          <div className="absolute top-full right-0 mt-2 w-72 bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow-xl z-50">
            <form onSubmit={handleOnboard} className="space-y-3">
              <h3 className="font-medium text-sm">Onboard New Tenant</h3>
              <input 
                type="text" 
                placeholder="Shop Domain (e.g. store.myshopify.com)" 
                className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-sm"
                value={newShopDomain}
                onChange={e => setNewShopDomain(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="Access Token" 
                className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-sm"
                value={newAccessToken}
                onChange={e => setNewAccessToken(e.target.value)}
              />
              <input 
                type="text" 
                placeholder="Webhook Secret (Optional)" 
                className="w-full bg-black border border-zinc-800 rounded px-2 py-1 text-sm"
                value={newWebhookSecret}
                onChange={e => setNewWebhookSecret(e.target.value)}
              />
              <button type="submit" className="w-full bg-white text-black rounded py-1 text-sm font-medium">
                Onboard
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Logout Button */}
      <button 
        onClick={() => signOut()}
        className="p-2 hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-white transition-colors"
        title="Logout"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
