import React, { useEffect, useState } from 'react';
import { InventoryItem, InventorySummary } from '../../types';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminSidebar } from '../../components/admin/AdminSidebar';

export const AdminInventoryPage: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'low' | 'out'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Adjustment Modal
  const [selectedProduct, setSelectedProduct] = useState<InventoryItem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState('Atelier Batch Replenishment');
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [actionMessage, setActionMessage] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchInventory = () => {
    setLoading(true);
    const token = localStorage.getItem('mq_admin_token');
    fetch('/api/admin/inventory', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setItems(data.items);
        setSummary(data.summary);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load inventory records:', err);
        setLoading(false);
      });
  };

  const fetchLogs = () => {
    const token = localStorage.getItem('mq_admin_token');
    fetch('/api/admin/inventory/logs', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setLogs(data))
      .catch(err => console.error('Failed to load logs:', err));
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    const token = localStorage.getItem('mq_admin_token');

    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: selectedProduct.id,
          adjustment: adjustAmount,
          reason: adjustReason
        })
      });

      if (res.ok) {
        setActionMessage(`Inventory updated for ${selectedProduct.title}.`);
        setSelectedProduct(null);
        fetchInventory();
        setTimeout(() => setActionMessage(''), 3000);
      }
    } catch (err) {
      console.error('Stock adjust error:', err);
    }
  };

  const handleQuickAdjust = async (productId: number, delta: number) => {
    const token = localStorage.getItem('mq_admin_token');
    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          adjustment: delta,
          reason: delta > 0 ? 'Quick Restock' : 'Damage/Salon Defect'
        })
      });
      if (res.ok) {
        fetchInventory();
      }
    } catch (err) {
      console.error('Quick adjust error:', err);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || item.category.toLowerCase() === categoryFilter.toLowerCase();

    let matchesStatus = true;
    if (statusFilter === 'healthy') matchesStatus = item.stock > 10;
    else if (statusFilter === 'low') matchesStatus = item.stock > 0 && item.stock <= 10;
    else if (statusFilter === 'out') matchesStatus = item.stock === 0;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const lowStockCount = items.filter(i => i.stock > 0 && i.stock <= 10).length;
  const outStockCount = items.filter(i => i.stock === 0).length;
  const healthyCount = items.filter(i => i.stock > 10).length;

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="lg:pl-72 transition-all duration-300">
        <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onSearch={setSearch} searchValue={search} searchPlaceholder="Search by SKU, product title, or variant..." />

        <main className="pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 pb-16">
          {/* Header Title & Actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between py-6 gap-4 border-b border-surface-container/80 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-secondary">
                <span className="text-[10px] uppercase tracking-[0.24em] font-bold">Logistics &amp; Vault Reserves</span>
                <span className="text-xs text-outline">•</span>
                <span className="text-[10px] uppercase tracking-wider text-outline font-medium">REAL-TIME TELEMETRY</span>
              </div>
              <h1 className="font-serif text-3xl font-normal text-primary tracking-tight">
                Inventory &amp; Stock Tracking
              </h1>
              <p className="text-xs text-on-surface-variant font-light mt-1">
                Monitor reserve thresholds, trigger batch replenishment, and inspect audit logs.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  fetchLogs();
                  setIsLogDrawerOpen(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-secondary/20 rounded-lg text-xs font-semibold text-primary uppercase tracking-wider hover:bg-surface-container-low transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[17px] text-secondary">history</span>
                <span>Audit Logs</span>
              </button>
            </div>
          </div>

          {actionMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{actionMessage}</span>
            </div>
          )}

          {/* 3 Large Health KPI Cards (Stitch-authentic with progress bars) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            {/* Card 1: In-Stock */}
            <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm border border-secondary/15 flex flex-col justify-between hover:shadow-gold-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  IN-STOCK ITEMS
                </span>
                <span className="material-symbols-outlined text-secondary text-[22px]">check_circle</span>
              </div>
              <div className="mt-4 flex flex-col">
                <span className="font-serif text-3xl font-normal text-primary tracking-tight leading-none">
                  {healthyCount} <span className="text-xs text-outline font-sans">SKUs</span>
                </span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="text-xs text-secondary font-medium">Healthy Inventory Levels</span>
                </div>
              </div>
              <div className="w-full bg-surface-container h-1.5 mt-4 rounded-full overflow-hidden">
                <div className="bg-secondary-gold h-full rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            {/* Card 2: Low Stock Alerts */}
            <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm border border-secondary/15 flex flex-col justify-between hover:shadow-gold-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  LOW STOCK ALERTS
                </span>
                <span className="material-symbols-outlined text-secondary text-[22px]">warning</span>
              </div>
              <div className="mt-4 flex flex-col">
                <span className="font-serif text-3xl font-normal text-secondary tracking-tight leading-none">
                  {lowStockCount} <span className="text-xs text-outline font-sans">SKUs</span>
                </span>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-secondary font-medium">Requires Restock Review</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold bg-secondary-fixed/50 text-secondary px-1.5 py-0.5 rounded">
                    ACTION REQ.
                  </span>
                </div>
              </div>
              <div className="w-full bg-surface-container h-1.5 mt-4 rounded-full overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: '42%' }} />
              </div>
            </div>

            {/* Card 3: Out of Stock */}
            <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm border border-secondary/15 flex flex-col justify-between hover:shadow-gold-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  OUT OF STOCK
                </span>
                <span className="material-symbols-outlined text-red-600 text-[22px]">
                  production_quantity_limits
                </span>
              </div>
              <div className="mt-4 flex flex-col">
                <span className="font-serif text-3xl font-normal text-red-700 tracking-tight leading-none">
                  {outStockCount} <span className="text-xs text-outline font-sans">SKUs</span>
                </span>
                <div className="flex items-center justify-between mt-2 text-xs">
                  <span className="text-on-surface-variant font-light">Backorder Routing</span>
                  <span className="text-[9px] uppercase tracking-wider font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                    ROUTED
                  </span>
                </div>
              </div>
              <div className="w-full bg-surface-container h-1.5 mt-4 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full rounded-full" style={{ width: outStockCount > 0 ? '100%' : '0%' }} />
              </div>
            </div>
          </div>

          {/* Low Stock Alert Notification Banner if needed */}
          {lowStockCount > 0 && (
            <div className="mb-8 p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-amber-700 text-[24px]">crisis_alert</span>
                <div>
                  <p className="text-xs font-semibold text-amber-900">
                    Low Stock Warning: {lowStockCount} formulation{lowStockCount > 1 ? 's' : ''} have fallen below the salon replenishment threshold.
                  </p>
                  <p className="text-[11px] text-amber-800 font-light">
                    Replenishment orders can be submitted directly from the table actions below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Filter Toolbar */}
          <div className="p-4 rounded-xl bg-surface-container-lowest shadow-sm border border-secondary/15 flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center bg-surface-container-low p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded text-[11px] uppercase tracking-wider font-semibold transition-all ${
                  statusFilter === 'all' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
                }`}
              >
                ALL ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('healthy')}
                className={`px-3 py-1 rounded text-[11px] uppercase tracking-wider font-semibold transition-all ${
                  statusFilter === 'healthy' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
                }`}
              >
                HEALTHY ({healthyCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('low')}
                className={`px-3 py-1 rounded text-[11px] uppercase tracking-wider font-semibold transition-all ${
                  statusFilter === 'low' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
                }`}
              >
                LOW STOCK ({lowStockCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('out')}
                className={`px-3 py-1 rounded text-[11px] uppercase tracking-wider font-semibold transition-all ${
                  statusFilter === 'out' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
                }`}
              >
                OUT OF STOCK ({outStockCount})
              </button>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-surface-container-low pl-3 pr-8 py-1.5 rounded-lg text-xs font-semibold text-primary outline-none cursor-pointer border border-secondary/15"
              >
                <option value="all">All Categories</option>
                <option value="skincare">Skincare</option>
                <option value="complexion">Complexion</option>
                <option value="lips & eyes">Lips &amp; Eyes</option>
                <option value="fragrance">Fragrance</option>
              </select>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-secondary/15 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-container-low/70 text-on-surface-variant text-[10px] uppercase tracking-wider font-semibold">
                    <th className="py-3 px-4">Formulation</th>
                    <th className="py-3 px-3">SKU</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3 text-right">On Hand</th>
                    <th className="py-3 px-3 text-right">Valuation</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Quick Restock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container-low">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-on-surface-variant font-serif">
                        Scanning vault stock telemetry...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-on-surface-variant font-serif">
                        No inventory matching active filters.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map(item => {
                      const isLow = item.stock <= 10 && item.stock > 0;
                      const isOut = item.stock === 0;

                      return (
                        <tr key={item.id} className="hover:bg-surface-container-low/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={item.image_url}
                                alt={item.title}
                                className="w-10 h-10 rounded-md object-cover border border-secondary/15 shrink-0"
                              />
                              <div>
                                <p className="font-semibold text-primary">{item.title}</p>
                                <p className="text-[10px] text-outline">{item.volume || '50 ml'}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3 font-mono text-outline text-[11px]">
                            MQ-SKN-0{item.id}
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-surface-container text-[10px] uppercase font-medium text-on-surface">
                              {item.category}
                            </span>
                          </td>

                          <td className="py-3.5 px-3 text-right font-serif font-bold text-primary text-sm">
                            {item.stock}
                          </td>

                          <td className="py-3.5 px-3 text-right font-serif text-primary">
                            ${(item.stock * item.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>

                          <td className="py-3.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-semibold ${
                                isOut
                                  ? 'bg-red-100 text-red-800'
                                  : isLow
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                              />
                              {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'Healthy'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQuickAdjust(item.id, -5)}
                                className="w-7 h-7 rounded bg-surface-container-low hover:bg-surface-container text-primary font-bold flex items-center justify-center text-xs"
                                title="Deduct 5"
                              >
                                -5
                              </button>
                              <button
                                type="button"
                                onClick={() => handleQuickAdjust(item.id, 10)}
                                className="w-7 h-7 rounded bg-surface-container-low hover:bg-surface-container text-primary font-bold flex items-center justify-center text-xs"
                                title="Add 10"
                              >
                                +10
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProduct(item);
                                  setAdjustAmount(15);
                                }}
                                className="p-1 rounded text-secondary hover:text-primary transition-colors"
                                title="Custom Batch Adjustment"
                              >
                                <span className="material-symbols-outlined text-[18px]">tune</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Custom Batch Adjustment Modal */}
          {selectedProduct && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-surface-container-lowest rounded-xl border border-secondary/30 p-6 max-w-md w-full shadow-gold-lg animate-in fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-surface-container mb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
                      VAULT LOGISTICS
                    </span>
                    <h3 className="font-serif text-lg text-primary font-medium">
                      Batch Adjust: {selectedProduct.title}
                    </h3>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="p-1 text-outline hover:text-primary">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <form onSubmit={handleAdjustStock} className="space-y-4">
                  <div className="p-3 bg-surface-container-low rounded-lg text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-outline">Current Stock:</span>
                      <span className="font-bold text-primary">{selectedProduct.stock} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-outline">Projected After Adjustment:</span>
                      <span className="font-bold text-secondary">
                        {Math.max(0, selectedProduct.stock + adjustAmount)} units
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-primary mb-1">
                      Adjustment Delta (+ to add, - to remove)
                    </label>
                    <input
                      type="number"
                      required
                      value={adjustAmount}
                      onChange={e => setAdjustAmount(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-primary mb-1">
                      Audit Reason &amp; Source
                    </label>
                    <select
                      value={adjustReason}
                      onChange={e => setAdjustReason(e.target.value)}
                      className="w-full px-3 py-2 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary cursor-pointer"
                    >
                      <option value="Atelier Batch Replenishment">Atelier Batch Replenishment</option>
                      <option value="Physical Vault Count Audit">Physical Vault Count Audit</option>
                      <option value="Damage / Laboratory Defect">Damage / Laboratory Defect</option>
                      <option value="VIP Private Tasting Flacon Allocation">VIP Private Tasting Flacon Allocation</option>
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end gap-3 border-t border-surface-container">
                    <button
                      type="button"
                      onClick={() => setSelectedProduct(null)}
                      className="px-4 py-2 rounded text-xs uppercase tracking-wider text-outline hover:text-primary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-primary text-on-primary px-6 py-2 rounded text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors shadow-sm"
                    >
                      Commit to Vault
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Audit Logs Drawer */}
          {isLogDrawerOpen && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
              <div className="w-full max-w-lg bg-surface-container-lowest h-full p-6 sm:p-8 shadow-2xl flex flex-col justify-between overflow-y-auto">
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-surface-container">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
                        TELEMETRY ARCHIVE
                      </span>
                      <h3 className="font-serif text-xl text-primary font-normal">Inventory Audit Log</h3>
                    </div>
                    <button onClick={() => setIsLogDrawerOpen(false)} className="p-1 text-outline hover:text-primary">
                      <span className="material-symbols-outlined text-[22px]">close</span>
                    </button>
                  </div>

                  <div className="mt-6 space-y-3">
                    {logs.length === 0 ? (
                      <p className="text-xs text-outline text-center py-12">No recent audit logs logged.</p>
                    ) : (
                      logs.map((l, i) => (
                        <div key={i} className="p-3.5 rounded-lg bg-surface-container-low text-xs space-y-1">
                          <div className="flex items-center justify-between font-semibold text-primary">
                            <span>{l.product_title || `Product #${l.product_id}`}</span>
                            <span className={l.change_amount >= 0 ? 'text-emerald-700' : 'text-red-600'}>
                              {l.change_amount > 0 ? `+${l.change_amount}` : l.change_amount}
                            </span>
                          </div>
                          <p className="text-on-surface-variant font-light text-[11px]">{l.reason}</p>
                          <p className="text-[10px] text-outline">
                            {new Date(l.logged_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-surface-container">
                  <button
                    onClick={() => setIsLogDrawerOpen(false)}
                    className="w-full py-2.5 bg-primary text-on-primary rounded text-xs uppercase tracking-widest font-semibold"
                  >
                    Close Log
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
