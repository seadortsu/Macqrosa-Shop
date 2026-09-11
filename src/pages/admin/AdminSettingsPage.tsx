import React, { useState, useEffect } from 'react';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { useAuth } from '../../context/AuthContext';
import { useStoreSettings, StoreSettings } from '../../context/StoreSettingsContext';

interface PromoCodeItem {
  id: number;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_spend: number;
  expires_at: string | null;
  max_uses: number | null;
  uses_count: number;
  is_active: number;
  created_at: string;
}

export const AdminSettingsPage: React.FC = () => {
  const { adminToken } = useAuth();
  const { refreshSettings } = useStoreSettings();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Store & Commerce State
  const [storeForm, setStoreForm] = useState<StoreSettings>({
    storeName: 'Macqrosa',
    tagline: 'Haute Parfumerie & Cosmétiques',
    contactEmail: 'support@macqrosa.com',
    contactPhone: '+33 1 42 60 00 00',
    currency: 'USD',
    timezone: 'America/New_York',
    address: '15 Place Vendôme',
    city: 'Paris',
    country: 'France',
    freeShippingThreshold: 150,
    standardShippingFee: 15,
    taxRate: 8.5,
    enableReviews: true,
    enableWishlist: true,
    enableGuestCheckout: false,
    maintenanceMode: false,
    lowStockThreshold: 10,
    orderPrefix: 'MQ',
  });

  // Promos State
  const [promos, setPromos] = useState<PromoCodeItem[]>([]);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<PromoCodeItem | null>(null);
  const [promoForm, setPromoForm] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: 15,
    min_spend: 0,
    expires_at: '',
    max_uses: '',
    is_active: true
  });

  // Load all live settings
  const loadLiveSettings = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/settings/admin', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.store_settings) setStoreForm(data.store_settings);
      }
    } catch (err) {
      console.error('Error fetching admin settings:', err);
    }
  };

  const loadPromos = async () => {
    if (!adminToken) return;
    try {
      const res = await fetch('/api/promos/admin', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPromos(data);
      }
    } catch (err) {
      console.error('Error loading promos:', err);
    }
  };

  useEffect(() => {
    loadLiveSettings();
    loadPromos();
  }, [adminToken]);

  const handleSaveSection = async (sectionKey: string, payloadData: any) => {
    if (!adminToken) return;
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const res = await fetch('/api/settings/admin', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          section: sectionKey,
          data: payloadData
        })
      });

      if (res.ok) {
        setSaveSuccess(true);
        await refreshSettings();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || 'Failed to save settings.');
      }
    } catch (err) {
      setErrorMessage('Network error while saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Promo Code handlers
  const handleSavePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;

    try {
      const url = editingPromo ? `/api/promos/admin/${editingPromo.id}` : '/api/promos/admin';
      const method = editingPromo ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          ...promoForm,
          max_uses: promoForm.max_uses ? parseInt(promoForm.max_uses) : null,
          expires_at: promoForm.expires_at || null
        })
      });

      if (res.ok) {
        setIsPromoModalOpen(false);
        setEditingPromo(null);
        await loadPromos();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save promo code.');
      }
    } catch {
      alert('Error saving promo.');
    }
  };

  const handleTogglePromo = async (promo: PromoCodeItem) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/promos/admin/${promo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ is_active: promo.is_active === 1 ? 0 : 1 })
      });
      if (res.ok) await loadPromos();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePromo = async (id: number) => {
    if (!adminToken || !confirm('Delete this privilege code?')) return;
    try {
      const res = await fetch(`/api/promos/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (res.ok) await loadPromos();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-72' : ''}`}>
        <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <main className="p-6 pt-24 max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-6 border-b border-surface-container mb-8">
            <div>
              <h1 className="text-2xl font-serif text-primary">Commerce Settings</h1>
              <p className="text-sm text-on-surface-variant mt-1">Manage boutique identity, tax, shipping, and promotional vouchers.</p>
            </div>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-800 text-xs font-medium border border-emerald-200 animate-fade-in">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
                  <span>Changes Deployed Live</span>
                </div>
              )}
              {errorMessage && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-50 text-rose-800 text-xs font-medium border border-rose-200">
                  <span className="material-symbols-outlined text-[16px] text-rose-600">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8 animate-fade-in">
            {/* Commerce Settings Card */}
            <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-container">
                <div>
                  <h2 className="font-serif text-xl text-primary font-medium">Boutique Identity, Tax &amp; Shipping Rules</h2>
                  <p className="text-xs text-on-surface-variant font-light mt-0.5">Parameters enforced dynamically in the patron checkout pipeline.</p>
                </div>
                <button
                  onClick={() => handleSaveSection('store_settings', storeForm)}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded hover:bg-black transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  <span>{isSaving ? 'Saving...' : 'Save Commerce Rules'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Maison Name</label>
                  <input
                    type="text"
                    value={storeForm.storeName}
                    onChange={e => setStoreForm(prev => ({ ...prev, storeName: e.target.value }))}
                    className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Tagline</label>
                  <input
                    type="text"
                    value={storeForm.tagline}
                    onChange={e => setStoreForm(prev => ({ ...prev, tagline: e.target.value }))}
                    className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Currency</label>
                  <select
                    value={storeForm.currency}
                    onChange={e => setStoreForm(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                  >
                    <option value="USD">USD ($) — US Dollar</option>
                    <option value="EUR">EUR (€) — Euro</option>
                    <option value="GBP">GBP (£) — British Pound</option>
                    <option value="GHS">GHS (₵) — Ghanaian Cedi</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Free Shipping Threshold ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-xs text-on-surface-variant">$</span>
                    <input
                      type="number"
                      min="0"
                      value={storeForm.freeShippingThreshold}
                      onChange={e => setStoreForm(prev => ({ ...prev, freeShippingThreshold: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Standard Shipping Fee ($)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-xs text-on-surface-variant">$</span>
                    <input
                      type="number"
                      min="0"
                      value={storeForm.standardShippingFee}
                      onChange={e => setStoreForm(prev => ({ ...prev, standardShippingFee: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-8 pr-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Sales Tax Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={storeForm.taxRate}
                      onChange={e => setStoreForm(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                    />
                    <span className="absolute right-3.5 top-2 text-xs text-on-surface-variant">%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Promotions & Vouchers Table */}
            <div className="bg-surface-container-lowest rounded-xl p-6 sm:p-8 border border-surface-container shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-surface-container">
                <div>
                  <h2 className="font-serif text-xl text-primary font-medium">Privilege Codes &amp; Marketing Vouchers</h2>
                  <p className="text-xs text-on-surface-variant font-light mt-0.5">Database-validated discount coupons for customer bags.</p>
                </div>
                <button
                  onClick={() => {
                    setEditingPromo(null);
                    setPromoForm({
                      code: '',
                      discount_type: 'percentage',
                      discount_value: 15,
                      min_spend: 0,
                      expires_at: '',
                      max_uses: '',
                      is_active: true
                    });
                    setIsPromoModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary-gold text-primary font-semibold text-xs uppercase tracking-wider rounded shadow-gold-sm hover:bg-white transition-all"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>Issue Privilege Code</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-surface-container text-on-surface-variant uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 font-semibold">Code</th>
                      <th className="py-3 px-4 font-semibold">Benefit</th>
                      <th className="py-3 px-4 font-semibold">Min Spend</th>
                      <th className="py-3 px-4 font-semibold">Redemptions</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {promos.map(p => (
                      <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-primary">
                          <span className="px-2.5 py-1 rounded bg-secondary-gold/15 border border-secondary-gold/30 text-primary font-semibold">
                            {p.code}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-primary">
                          {p.discount_type === 'percentage' ? `${p.discount_value}% Off` : `$${p.discount_value} Off`}
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant">
                          {p.min_spend > 0 ? `$${p.min_spend.toFixed(2)}` : 'None'}
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant">
                          {p.uses_count} {p.max_uses ? `/ ${p.max_uses}` : 'uses'}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleTogglePromo(p)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                              p.is_active === 1
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-neutral-100 text-neutral-600 border border-neutral-300'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${p.is_active === 1 ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                            <span>{p.is_active === 1 ? 'Active' : 'Disabled'}</span>
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingPromo(p);
                                setPromoForm({
                                  code: p.code,
                                  discount_type: p.discount_type,
                                  discount_value: p.discount_value,
                                  min_spend: p.min_spend,
                                  expires_at: p.expires_at ? p.expires_at.slice(0, 10) : '',
                                  max_uses: p.max_uses ? p.max_uses.toString() : '',
                                  is_active: p.is_active === 1
                                });
                                setIsPromoModalOpen(true);
                              }}
                              className="p-1.5 text-on-surface-variant hover:text-primary rounded hover:bg-surface-container"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleDeletePromo(p.id)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal: Create/Edit Promo Code */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-lg w-full p-6 sm:p-8 border border-secondary/30 shadow-gold-xl animate-fade-in">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-container">
              <h3 className="font-serif text-xl text-primary font-medium">
                {editingPromo ? 'Edit Privilege Code' : 'Issue New Privilege Code'}
              </h3>
              <button onClick={() => setIsPromoModalOpen(false)} className="p-1 text-on-surface-variant hover:text-primary rounded-lg">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Privilege Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VENDOME20"
                  value={promoForm.code}
                  onChange={e => setPromoForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm font-mono text-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Discount Type</label>
                  <select
                    value={promoForm.discount_type}
                    onChange={e => setPromoForm(prev => ({ ...prev, discount_type: e.target.value as any }))}
                    className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Deduction ($)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Value</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={promoForm.discount_value}
                    onChange={e => setPromoForm(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Minimum Spend ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={promoForm.min_spend}
                    onChange={e => setPromoForm(prev => ({ ...prev, min_spend: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-primary font-semibold mb-1.5">Max Redemptions</label>
                  <input
                    type="number"
                    placeholder="Unlimited"
                    value={promoForm.max_uses}
                    onChange={e => setPromoForm(prev => ({ ...prev, max_uses: e.target.value }))}
                    className="w-full px-4 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-surface-container mt-6">
                <button type="button" onClick={() => setIsPromoModalOpen(false)} className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-on-surface-variant hover:text-primary">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-primary text-secondary-gold text-xs uppercase tracking-wider font-semibold rounded shadow-sm hover:bg-black transition-all">
                  Save Privilege Code
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
