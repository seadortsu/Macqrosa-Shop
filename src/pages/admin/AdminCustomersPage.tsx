import React, { useEffect, useState } from 'react';
import { Customer } from '../../types';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminSidebar } from '../../components/admin/AdminSidebar';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<{ totalCustomers: number; totalRevenue: number; vipCount: number } | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerDetail, setCustomerDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);

  // Customer Edit State
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editCustomerForm, setEditCustomerForm] = useState({ firstName: '', lastName: '', phone: '', tier: '' });
  const [isSavingCustomer, setIsSavingCustomer] = useState(false);

  const fetchCustomers = () => {
    setLoading(true);
    const token = localStorage.getItem('mq_admin_token');
    const params = new URLSearchParams();
    if (search) params.set('search', search);

    fetch(`/api/admin/customers?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setCustomers(data.customers || []);
        setSummary(data.summary || null);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load customers:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const handleInspectCustomer = (id: number) => {
    setSelectedCustomerId(id);
    setDetailLoading(true);
    setIsEditingCustomer(false);
    const token = localStorage.getItem('mq_admin_token');

    fetch(`/api/admin/customers/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setCustomerDetail(data);
        if (data.customer) {
          setEditCustomerForm({
            firstName: data.customer.first_name || '',
            lastName: data.customer.last_name || '',
            phone: data.customer.phone || '',
            tier: data.customer.tier || 'Circle Privé'
          });
        }
        setDetailLoading(false);
      })
      .catch(err => {
        console.error('Failed to load customer profile:', err);
        setDetailLoading(false);
      });
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    setIsSavingCustomer(true);
    const token = localStorage.getItem('mq_admin_token');
    try {
      const res = await fetch(`/api/admin/customers/${selectedCustomerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editCustomerForm)
      });
      if (res.ok) {
        const updatedCustomer = await res.json();
        setCustomerDetail((prev: any) => ({
          ...prev,
          customer: updatedCustomer
        }));
        setIsEditingCustomer(false);
        fetchCustomers();
      }
    } catch (err) {
      console.error('Failed to update customer:', err);
    } finally {
      setIsSavingCustomer(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCustomerId || !window.confirm('Are you sure you want to completely erase this patron from the registry?')) return;
    const token = localStorage.getItem('mq_admin_token');
    try {
      const res = await fetch(`/api/admin/customers/${selectedCustomerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedCustomerId(null);
        fetchCustomers();
      }
    } catch (err) {
      console.error('Failed to delete customer:', err);
    }
  };

  const handleBulkAction = async (action: 'delete' | 'update_tier', payload?: any) => {
    if (selectedCustomerIds.length === 0) return;
    if (action === 'delete' && !window.confirm(`Are you sure you want to delete ${selectedCustomerIds.length} patrons?`)) return;

    const token = localStorage.getItem('mq_admin_token');
    try {
      const res = await fetch('/api/admin/customers/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, ids: selectedCustomerIds, payload })
      });
      if (res.ok) {
        setSelectedCustomerIds([]);
        fetchCustomers();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to perform bulk action.');
      }
    } catch (err) {
      console.error('Failed bulk action:', err);
    }
  };

  const toggleSelectAll = () => {
    if (selectedCustomerIds.length === customers.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(customers.map(c => c.id));
    }
  };

  const toggleSelectCustomer = (id: number) => {
    setSelectedCustomerIds(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const loadStaff = undefined;



  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="lg:pl-72 transition-all duration-300">
        <AdminHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          searchValue={search}
          onSearch={setSearch}
          searchPlaceholder="Search customers by name or email..."
        />

        <main className="pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 pb-16">
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 py-6 border-b border-surface-container mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-[0.24em] text-secondary font-bold">
                  REGISTRY
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-gold" />
                <span className="text-[10px] uppercase tracking-wider text-outline">
                  SYSTEM ADMINISTRATION
                </span>
              </div>
              <h1 className="font-serif text-3xl text-primary font-normal">
                Patron Management
              </h1>
            </div>
          </div>

          {/* Metric Quadrants */}
          {summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-outline font-semibold">Registered Patrons</span>
                <h2 className="font-serif text-2xl font-bold text-primary mt-1">{summary.totalCustomers} Clients</h2>
                <span className="text-[10px] text-emerald-700 font-semibold mt-1 block">Active Place Vendôme registry</span>
              </div>

              <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-outline font-semibold">VIP Circle Privé Tier</span>
                <h2 className="font-serif text-2xl font-bold text-secondary mt-1">{summary.vipCount} Patrons</h2>
                <span className="text-[10px] text-outline mt-1 block">&gt;$500 Cumulative patronage</span>
              </div>

              <div className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container shadow-sm">
                <span className="text-[10px] uppercase tracking-wider text-outline font-semibold">Total Patron Lifetime Value</span>
                <h2 className="font-serif text-2xl font-bold text-primary mt-1 font-mono">
                  ${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h2>
                <span className="text-[10px] text-secondary font-semibold mt-1 block">Gross Client Receipts</span>
              </div>
            </div>
          )}

          {/* Bulk Actions Menu */}
          {selectedCustomerIds.length > 0 && (
            <div className="flex items-center justify-between bg-surface-container-low border border-secondary/20 p-3 rounded-lg mb-4 animate-fade-in">
              <span className="text-xs font-semibold text-primary">
                {selectedCustomerIds.length} patrons selected
              </span>
              <div className="flex items-center gap-3">
                <select
                  className="px-3 py-1.5 rounded bg-surface-container-lowest border border-secondary/15 text-xs text-on-surface outline-none"
                  onChange={e => {
                    if (e.target.value) {
                      handleBulkAction('update_tier', { tier: e.target.value });
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>Change Tier...</option>
                  <option value="Circle Privé Member">Circle Privé Member</option>
                  <option value="Ambassadrice d'Or">Ambassadrice d'Or</option>
                </select>
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1.5 rounded bg-error/10 text-error hover:bg-error hover:text-white transition-colors text-xs font-semibold"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          )}

          {/* Customer Directory Table */}
          <div className="bg-surface-container-lowest border border-surface-container rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container-low/60 border-b border-surface-container text-[10px] uppercase tracking-wider text-outline font-semibold">
                  <tr>
                    <th className="p-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={customers.length > 0 && selectedCustomerIds.length === customers.length}
                        onChange={toggleSelectAll}
                        className="rounded border-outline cursor-pointer"
                      />
                    </th>
                    <th className="p-4">Patron Name</th>
                    <th className="p-4">VIP Circle Tier</th>
                    <th className="p-4">Contact Coordinates</th>
                    <th className="p-4">Acquisitions</th>
                    <th className="p-4">Total Expenditure</th>
                    <th className="p-4 text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-on-surface-variant font-serif">
                        Retrieving client dossiers...
                      </td>
                    </tr>
                  ) : customers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-on-surface-variant">
                        No clients matched your search query.
                      </td>
                    </tr>
                  ) : (
                    customers.map(c => (
                      <tr key={c.id} className="hover:bg-surface-container-low/30 transition-colors">
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={selectedCustomerIds.includes(c.id)}
                            onChange={() => toggleSelectCustomer(c.id)}
                            className="rounded border-outline cursor-pointer"
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-serif text-xs font-bold shrink-0">
                              {c.firstName ? c.firstName[0] : 'C'}
                            </div>
                            <div>
                              <span className="font-serif text-xs font-bold text-primary block leading-tight">
                                {c.firstName} {c.lastName}
                              </span>
                              <span className="text-[10px] text-outline">Joined {new Date(c.createdAt || Date.now()).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</span>
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full bg-secondary-fixed text-primary text-[10px] uppercase tracking-wider font-bold">
                            {c.tier || 'Circle Privé'}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="text-primary font-medium block">{c.email}</span>
                          <span className="text-[10px] text-outline">{c.phone || 'Private Number'}</span>
                        </td>

                        <td className="p-4 font-mono font-semibold text-primary">
                          {c.ordersCount} Orders
                        </td>

                        <td className="p-4 font-serif font-bold text-primary text-sm">
                          ${(c.totalSpent || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>

                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                handleInspectCustomer(c.id);
                                setTimeout(() => setIsEditingCustomer(true), 500); // Quick edit trick
                              }}
                              className="p-1.5 text-on-surface-variant hover:text-primary transition-colors"
                              title="Edit Patron"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                              onClick={() => handleInspectCustomer(c.id)}
                              className="px-3 py-1.5 rounded bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-[11px] transition-colors shadow-sm"
                            >
                              Inspect Dossier →
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Customer Detail Drawer Modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-fade-in">
          <div className="w-full max-w-xl bg-surface-container-lowest h-full p-6 sm:p-8 flex flex-col justify-between shadow-2xl overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-surface-container mb-6">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">
                    Place Vendôme Patron Dossier
                  </span>
                  <h3 className="font-serif text-2xl text-primary font-semibold">
                    {customerDetail?.customer?.first_name} {customerDetail?.customer?.last_name}
                  </h3>
                </div>
                <div className="flex gap-4 items-center">
                  {!isEditingCustomer && customerDetail && (
                    <button
                      onClick={() => setIsEditingCustomer(true)}
                      className="text-xs uppercase tracking-wider font-semibold text-secondary-gold hover:text-primary transition-colors"
                    >
                      Edit Profile
                    </button>
                  )}
                  <button onClick={() => setSelectedCustomerId(null)} className="text-outline hover:text-primary">
                    <span className="material-symbols-outlined text-2xl">close</span>
                  </button>
                </div>
              </div>

              {detailLoading || !customerDetail ? (
                <div className="py-12 text-center text-on-surface-variant font-serif">
                  Loading patron archives...
                </div>
              ) : isEditingCustomer ? (
                <form onSubmit={handleUpdateCustomer} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">First Name</label>
                      <input
                        type="text"
                        value={editCustomerForm.firstName}
                        onChange={e => setEditCustomerForm(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">Last Name</label>
                      <input
                        type="text"
                        value={editCustomerForm.lastName}
                        onChange={e => setEditCustomerForm(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={editCustomerForm.phone}
                        onChange={e => setEditCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">VIP Tier</label>
                      <select
                        value={editCustomerForm.tier}
                        onChange={e => setEditCustomerForm(prev => ({ ...prev, tier: e.target.value }))}
                        className="w-full px-3 py-2 bg-surface-container-low border border-surface-container rounded text-sm text-primary"
                      >
                        <option value="Circle Privé Member">Circle Privé Member</option>
                        <option value="Gold Signature">Gold Signature</option>
                        <option value="Platinum Elite">Platinum Elite</option>
                        <option value="VIP Patron">VIP Patron</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-surface-container flex justify-between items-center">
                    <button
                      type="button"
                      onClick={handleDeleteCustomer}
                      className="text-red-700 hover:text-red-900 font-semibold text-[11px] px-3 py-1.5 rounded hover:bg-red-50 transition-colors uppercase tracking-wider"
                    >
                      Delete Patron
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingCustomer(false)}
                        className="px-4 py-2 border border-surface-container text-primary font-semibold text-[11px] uppercase tracking-wider rounded hover:bg-surface-container-low"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingCustomer}
                        className="px-4 py-2 bg-primary text-secondary-gold font-semibold text-[11px] uppercase tracking-wider rounded hover:bg-black transition-all disabled:opacity-50"
                      >
                        {isSavingCustomer ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="space-y-6 text-xs">
                  {/* Overview pill cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-surface-container-low text-center">
                      <span className="text-[10px] uppercase text-outline block">Patron Tier</span>
                      <span className="font-semibold text-secondary text-xs">{customerDetail.customer.tier}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container-low text-center">
                      <span className="text-[10px] uppercase text-outline block">Total Spend</span>
                      <span className="font-serif font-bold text-primary text-xs">
                        ${customerDetail.customer.total_spent?.toFixed(2)}
                      </span>
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container-low text-center">
                      <span className="text-[10px] uppercase text-outline block">Points Balance</span>
                      <span className="font-mono font-bold text-primary text-xs">
                        {customerDetail.customer.points} pts
                      </span>
                    </div>
                  </div>

                  {/* Contact & Address */}
                  <div className="p-4 rounded-lg bg-surface-container-low border border-surface-container space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-secondary font-bold block mb-1">
                      Registered Residence &amp; Contact
                    </span>
                    <p className="font-medium text-primary">Email: {customerDetail.customer.email}</p>
                    <p className="font-light text-on-surface-variant">Phone: {customerDetail.customer.phone || 'None'}</p>
                    {customerDetail.addresses && customerDetail.addresses[0] && (
                      <p className="font-light text-on-surface-variant pt-1 border-t border-surface-container mt-1">
                        {customerDetail.addresses[0].address_line1} {customerDetail.addresses[0].address_line2}, {customerDetail.addresses[0].city}, {customerDetail.addresses[0].state} {customerDetail.addresses[0].postal_code}
                      </p>
                    )}
                  </div>

                  {/* Purchase History */}
                  <div>
                    <h4 className="font-serif text-sm font-semibold text-primary mb-3">
                      Acquisition History ({customerDetail.orders?.length || 0} Orders)
                    </h4>
                    <div className="space-y-3">
                      {customerDetail.orders?.map((ord: any) => (
                        <div key={ord.id} className="p-3.5 rounded-lg border border-surface-container bg-white space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-primary">{ord.order_number}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-surface-container text-primary">
                              {ord.status}
                            </span>
                          </div>
                          <div className="divide-y divide-surface-container-low text-[11px]">
                            {ord.items?.map((it: any, i: number) => (
                              <div key={i} className="py-1 flex justify-between text-on-surface-variant">
                                <span className="truncate max-w-[260px]">{it.product_title} (x{it.quantity})</span>
                                <span className="font-mono font-medium">${it.total_price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          <div className="pt-2 border-t border-surface-container flex justify-between font-semibold text-primary">
                            <span>Total Paid</span>
                            <span className="font-serif font-bold">${ord.total_amount.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedCustomerId(null)}
              className="w-full mt-6 py-3 bg-primary text-white rounded text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800"
            >
              Close Client Dossier
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
