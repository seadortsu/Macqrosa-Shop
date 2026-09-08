import React, { useEffect, useState } from 'react';
import { Order } from '../../types';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminSidebar } from '../../components/admin/AdminSidebar';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [trackingInput, setTrackingInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    const token = localStorage.getItem('mq_admin_token');
    const params = new URLSearchParams();
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (search) params.set('search', search);

    fetch(`/api/orders/admin/all?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOrders(data);
          if (data.length > 0 && !selectedOrder) {
            setSelectedOrder(data[0]);
            setTrackingInput(data[0].tracking_number || '');
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load orders:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, search]);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
    setTrackingInput(order.tracking_number || '');
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    const token = localStorage.getItem('mq_admin_token');
    try {
      const res = await fetch(`/api/orders/admin/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setStatusMessage(`Order status updated to "${newStatus}". Storefront synchronized!`);
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus as any });
        }
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleUpdateTracking = async (orderId: number) => {
    const token = localStorage.getItem('mq_admin_token');
    try {
      const res = await fetch(`/api/orders/admin/${orderId}/tracking`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ trackingNumber: trackingInput })
      });

      if (res.ok) {
        setStatusMessage('Courier tracking code successfully saved.');
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, tracking_number: trackingInput });
        }
        setTimeout(() => setStatusMessage(''), 3000);
      }
    } catch (err) {
      console.error('Tracking update failed:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'shipped':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'processing':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'pending':
      default:
        return 'bg-neutral-100 text-neutral-800 border-neutral-300';
    }
  };

  // Status step number for visual stepper
  const getStepIndex = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 1;
      case 'processing':
        return 2;
      case 'shipped':
        return 3;
      case 'delivered':
        return 4;
      default:
        return 1;
    }
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const processingCount = orders.filter(o => o.status === 'processing').length;
  const shippedCount = orders.filter(o => o.status === 'shipped').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="lg:pl-72 transition-all duration-300">
        <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onSearch={setSearch} searchValue={search} searchPlaceholder="Search by order ID, customer name, email..." />

        <main className="pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 pb-16">
          {/* Top Title & Utility Area */}
          <div className="flex flex-col md:flex-row md:items-end justify-between py-6 gap-4 border-b border-surface-container/80 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-secondary">
                <span className="text-[10px] uppercase tracking-[0.24em] font-bold">Fulfillment Operations</span>
                <span className="text-xs text-outline">•</span>
                <span className="text-[10px] uppercase tracking-wider text-outline font-medium">Q4 LIVE METRICS</span>
              </div>
              <h1 className="font-serif text-3xl font-normal text-primary tracking-tight">
                Order Management &amp; Fulfillment
              </h1>
              <p className="text-xs text-on-surface-variant font-light mt-1">
                Track, process, and dispatch white-glove climate-controlled luxury customer shipments.
              </p>
            </div>
          </div>

          {statusMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Status Counter Metric Cards (Stitch-authentic 6 cards) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-secondary/15 flex flex-col justify-between hover:shadow-gold-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  ALL ORDERS
                </span>
                <span className="material-symbols-outlined text-outline text-[18px]">inbox</span>
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <span className="font-serif text-2xl font-bold text-primary">{orders.length}</span>
                <span className="text-[10px] uppercase text-outline">Total</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-secondary/15 flex flex-col justify-between hover:shadow-gold-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  PENDING
                </span>
                <span className="w-2 h-2 rounded-full bg-secondary" />
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <span className="font-serif text-2xl font-bold text-primary">{pendingCount}</span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-primary text-[9px] uppercase tracking-wider font-semibold">
                  Pending
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-secondary/15 flex flex-col justify-between hover:shadow-gold-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  PROCESSING
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <span className="font-serif text-2xl font-bold text-primary">{processingCount}</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] uppercase tracking-wider font-semibold">
                  Active
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-secondary/15 flex flex-col justify-between hover:shadow-gold-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  SHIPPED
                </span>
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <span className="font-serif text-2xl font-bold text-primary">{shippedCount}</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[9px] uppercase tracking-wider font-semibold">
                  In Transit
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-secondary/15 flex flex-col justify-between hover:shadow-gold-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  DELIVERED
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <span className="font-serif text-2xl font-bold text-primary">{deliveredCount}</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] uppercase tracking-wider font-semibold">
                  Complete
                </span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-secondary/15 flex flex-col justify-between hover:shadow-gold-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                  CANCELLED
                </span>
                <span className="w-2 h-2 rounded-full bg-outline" />
              </div>
              <div className="flex items-baseline justify-between mt-3">
                <span className="font-serif text-2xl font-bold text-primary">{cancelledCount}</span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container text-outline text-[9px] uppercase tracking-wider font-semibold">
                  Void
                </span>
              </div>
            </div>
          </div>

          {/* Main Workspace: Split Orders Table + Right Order Dossier */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Left 8-Column Orders Table */}
            <div className="xl:col-span-8 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm border border-secondary/15 overflow-hidden">
              {/* Status Tabs Bar */}
              <div className="flex items-center gap-2 px-6 pt-5 pb-3 overflow-x-auto border-b border-surface-container/60">
                {[
                  { label: 'All', value: 'all' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Processing', value: 'processing' },
                  { label: 'Shipped', value: 'shipped' },
                  { label: 'Delivered', value: 'delivered' },
                  { label: 'Cancelled', value: 'cancelled' }
                ].map(tab => {
                  const isActive = statusFilter === tab.value;
                  return (
                    <button
                      key={tab.value}
                      type="button"
                      onClick={() => setStatusFilter(tab.value)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider font-semibold transition-all shrink-0 ${
                        isActive
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Table */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-surface-container-low/70 text-on-surface-variant text-[10px] uppercase tracking-wider">
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-3">Date &amp; Time</th>
                      <th className="py-3 px-3">Customer</th>
                      <th className="py-3 px-3">Items</th>
                      <th className="py-3 px-3 text-right">Total</th>
                      <th className="py-3 px-3">Payment</th>
                      <th className="py-3 px-4">Fulfillment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container-low">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-on-surface-variant font-serif">
                          Loading orders stream...
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-on-surface-variant font-serif">
                          No orders matching current filter.
                        </td>
                      </tr>
                    ) : (
                      orders.map(order => {
                        const isSelected = selectedOrder?.id === order.id;
                        const date = new Date(order.created_at);

                        return (
                          <tr
                            key={order.id}
                            onClick={() => handleSelectOrder(order)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-secondary-fixed/15 border-l-2 border-secondary'
                                : 'hover:bg-surface-container-low/50'
                            }`}
                          >
                            <td className="py-3.5 px-4 font-semibold text-primary">
                              #{order.order_number}
                            </td>
                            <td className="py-3.5 px-3 text-on-surface-variant whitespace-nowrap">
                              <span className="block font-medium text-primary">
                                {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className="text-[10px] text-outline">
                                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="font-medium text-primary">{order.customer_name}</div>
                              <div className="text-[10px] text-outline truncate max-w-[130px]">
                                {order.customer_email}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-on-surface-variant">
                              {order.items?.length || 1} item{order.items?.length !== 1 ? 's' : ''}
                            </td>
                            <td className="py-3.5 px-3 text-right font-serif font-bold text-primary">
                              ${order.total_amount.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-[9px] uppercase tracking-wider font-semibold text-primary">
                                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                                {order.payment_status || 'Paid'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-semibold border ${getStatusBadge(
                                  order.status
                                )}`}
                              >
                                {order.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 4-Column Live Order Dossier Preview */}
            <div className="xl:col-span-4 flex flex-col gap-6">
              {selectedOrder ? (
                <div className="bg-surface-container-lowest rounded-xl shadow-md border border-secondary/15 p-6 flex flex-col gap-5 sticky top-28">
                  {/* Order Header */}
                  <div className="flex items-start justify-between pb-3 border-b border-surface-container">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-serif text-xl font-bold text-primary">
                          #{selectedOrder.order_number}
                        </h2>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-semibold border ${getStatusBadge(
                            selectedOrder.status
                          )}`}
                        >
                          {selectedOrder.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-outline mt-0.5">
                        {new Date(selectedOrder.created_at).toLocaleString()} • Online Salon
                      </p>
                    </div>
                  </div>

                  {/* 4-Step Visual Fulfillment Flow Stepper */}
                  <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-3 border border-secondary/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-semibold">
                        Fulfillment Flow
                      </span>
                      <span className="text-[10px] text-secondary font-bold uppercase">
                        Step {getStepIndex(selectedOrder.status)} of 4
                      </span>
                    </div>

                    <div className="relative flex items-center justify-between pt-1">
                      {/* Progress Line */}
                      <div className="absolute top-[13px] left-3 right-3 h-0.5 bg-surface-container-high -z-0" />
                      <div
                        className="absolute top-[13px] left-3 h-0.5 bg-primary transition-all duration-500 -z-0"
                        style={{
                          width: `${((getStepIndex(selectedOrder.status) - 1) / 3) * 100}%`
                        }}
                      />

                      {/* Step 1: Ordered */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            getStepIndex(selectedOrder.status) >= 1
                              ? 'bg-primary text-white'
                              : 'bg-surface-container text-outline'
                          }`}
                        >
                          ✓
                        </div>
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-primary">
                          Ordered
                        </span>
                      </div>

                      {/* Step 2: Processing */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            getStepIndex(selectedOrder.status) >= 2
                              ? 'bg-primary text-white ring-2 ring-secondary-container'
                              : 'bg-surface-container text-outline'
                          }`}
                        >
                          {getStepIndex(selectedOrder.status) > 2 ? '✓' : '2'}
                        </div>
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-primary">
                          Process
                        </span>
                      </div>

                      {/* Step 3: Shipped */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            getStepIndex(selectedOrder.status) >= 3
                              ? 'bg-primary text-white ring-2 ring-secondary-container'
                              : 'bg-surface-container text-outline'
                          }`}
                        >
                          {getStepIndex(selectedOrder.status) > 3 ? '✓' : '3'}
                        </div>
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-primary">
                          Shipped
                        </span>
                      </div>

                      {/* Step 4: Delivered */}
                      <div className="flex flex-col items-center gap-1 z-10">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            getStepIndex(selectedOrder.status) >= 4
                              ? 'bg-primary text-white ring-2 ring-secondary-container'
                              : 'bg-surface-container text-outline'
                          }`}
                        >
                          {getStepIndex(selectedOrder.status) >= 4 ? '✓' : '4'}
                        </div>
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-primary">
                          Delivered
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Updater Selector */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-primary mb-1">
                      Update Fulfillment Status
                    </label>
                    <select
                      value={selectedOrder.status}
                      onChange={e => handleUpdateStatus(selectedOrder.id, e.target.value)}
                      className="w-full px-3.5 py-2 bg-surface-container-low border border-secondary/20 rounded-lg text-xs font-semibold text-primary outline-none focus:border-secondary cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  {/* Tracking Number Input */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-primary mb-1">
                      White Glove Tracking Code
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. MQ-FDX-882194"
                        value={trackingInput}
                        onChange={e => setTrackingInput(e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-surface-container-low border border-secondary/20 rounded-lg text-xs text-primary font-mono outline-none focus:border-secondary"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateTracking(selectedOrder.id)}
                        className="bg-primary text-on-primary px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider font-semibold hover:bg-neutral-800 transition-colors shadow-xs"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Line Items Breakdown */}
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-outline block mb-2 font-semibold">
                      Sacred Line Items ({selectedOrder.items?.length || 0})
                    </span>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {selectedOrder.items?.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-container-low"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {it.image_url && (
                              <img
                                src={it.image_url}
                                alt={it.product_title}
                                className="w-8 h-8 rounded object-cover border border-secondary/15 shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-primary truncate">{it.product_title}</p>
                              <p className="text-[10px] text-outline">Qty: {it.quantity}</p>
                            </div>
                          </div>
                          <span className="font-serif font-bold text-primary shrink-0">
                            ${(it.product_price * it.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Coordinates */}
                  <div className="p-3.5 rounded-xl bg-surface-container-low text-xs space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-outline block font-semibold">
                      Shipping Coordinates
                    </span>
                    <p className="font-semibold text-primary">{selectedOrder.customer_name}</p>
                    <p className="text-on-surface-variant font-light">
                      {selectedOrder.shipping_address?.addressLine1}, {selectedOrder.shipping_address?.city},{' '}
                      {selectedOrder.shipping_address?.postalCode}, {selectedOrder.shipping_address?.country}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-surface-container-lowest rounded-xl p-8 text-center text-outline border border-secondary/15 font-serif text-sm">
                  Select an order to inspect fulfillment dossier and tracking status.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
