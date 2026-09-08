import React, { useEffect, useState } from 'react';
import { AnalyticsData } from '../../types';
import { AdminHeader } from '../../components/admin/AdminHeader';
import { AdminSidebar } from '../../components/admin/AdminSidebar';

export const AdminAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDateRange, setActiveDateRange] = useState('30d');
  const [activeCategory, setActiveCategory] = useState('All Categories');
  const [activeProduct, setActiveProduct] = useState('All Products');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/categories/summary').then(r => r.json()).then(data => setCategories(data || []));
    fetch('/api/products').then(r => r.json()).then(data => setProducts(data.products || []));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('mq_admin_token');
    const params = new URLSearchParams({
      period: activeDateRange,
      category: activeCategory,
      product: activeProduct
    });
    fetch(`/api/admin/analytics?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load analytics telemetry:', err);
        setLoading(false);
      });
  }, [activeDateRange, activeCategory, activeProduct]);

  const handleExportCSV = () => {
    if (!data) return;
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Metric,Value\n" +
      `Total Revenue,${data.kpis.totalRevenue}\n` +
      `Total Orders,${data.kpis.totalOrders}\n` +
      `Average Order Value,${data.kpis.averageOrderValue}\n` +
      `Conversion Rate,${data.kpis.conversionRate}%\n` +
      `Total Registered Patrons,${data.kpis.totalCustomers}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Macqrosa_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="lg:pl-72 transition-all duration-300">
        <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} searchPlaceholder="Search metrics, orders, or products..." />

        <main className="pt-20 sm:pt-24 px-4 sm:px-6 lg:px-8 pb-16">
          {/* Top Command Bar */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 py-6 border-b border-surface-container/80 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] uppercase tracking-[0.24em] text-secondary font-bold">
                  MACQROSA INTELLIGENCE
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-secondary-gold" />
                <span className="text-[10px] uppercase tracking-wider text-outline font-medium">
                  REAL-TIME TELEMETRY
                </span>
              </div>
              <h1 className="font-serif text-3xl font-normal text-primary tracking-tight">
                Analytics &amp; Performance Overview
              </h1>
              <p className="text-xs text-on-surface-variant font-light mt-1">
                Live monitoring of customer acquisitions, sales velocity curves, and formulation turnover across all channels.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Date Filter Pills */}
              <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-secondary/15">
                <button
                  type="button"
                  onClick={() => setActiveDateRange('7d')}
                  className={`px-3 py-1 rounded text-xs uppercase tracking-wider font-semibold transition-all ${
                    activeDateRange === '7d' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
                  }`}
                >
                  7D
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDateRange('30d')}
                  className={`px-3 py-1 rounded text-xs uppercase tracking-wider font-semibold transition-all ${
                    activeDateRange === '30d' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
                  }`}
                >
                  30D
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDateRange('90d')}
                  className={`px-3 py-1 rounded text-xs uppercase tracking-wider font-semibold transition-all ${
                    activeDateRange === '90d' ? 'bg-surface-container-lowest text-primary shadow-xs' : 'text-on-surface-variant'
                  }`}
                >
                  Q4
                </button>
              </div>

              {/* Category Filter */}
              <select
                value={activeCategory}
                onChange={e => setActiveCategory(e.target.value)}
                className="px-3 py-2 bg-surface-container-low border border-secondary/15 rounded-lg text-xs text-on-surface outline-none cursor-pointer"
              >
                <option value="All Categories">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>

              {/* Product Filter */}
              <select
                value={activeProduct}
                onChange={e => setActiveProduct(e.target.value)}
                className="max-w-[150px] truncate px-3 py-2 bg-surface-container-low border border-secondary/15 rounded-lg text-xs text-on-surface outline-none cursor-pointer"
              >
                <option value="All Products">All Products</option>
                {products.map(p => (
                  <option key={p.id} value={p.id.toString()}>{p.title}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-surface-container-lowest border border-secondary/20 rounded-lg text-xs font-semibold text-primary uppercase tracking-wider hover:bg-surface-container-low transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[17px] text-secondary">file_download</span>
                <span>Export Telemetry</span>
              </button>
            </div>
          </div>

          {loading || !data ? (
            <div className="py-32 text-center text-on-surface-variant font-serif text-lg">
              Synthesizing real-time telemetry from Place Vendôme vault...
            </div>
          ) : (
            <div className="space-y-8">
              {/* 4 Luxury KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* KPI 1: Revenue */}
                <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm border border-secondary/15 flex flex-col justify-between hover:shadow-gold-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                        Total Revenue
                      </span>
                      <span className="font-serif text-3xl text-primary font-medium mt-1 tracking-tight">
                        ${data.kpis.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                      <span className="material-symbols-outlined text-[22px]">payments</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-4 pt-2 bg-gradient-to-r from-surface-container-low/50 to-transparent p-1.5 rounded-lg text-xs">
                    <span className="flex items-center text-secondary font-semibold">
                      <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                      {data.kpis.revenueGrowth}
                    </span>
                    <span className="text-on-surface-variant font-light">vs. previous period</span>
                  </div>
                </div>

                {/* KPI 2: Total Orders */}
                <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm border border-secondary/15 flex flex-col justify-between hover:shadow-gold-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                        Total Orders
                      </span>
                      <span className="font-serif text-3xl text-primary font-medium mt-1 tracking-tight">
                        {data.kpis.totalOrders.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                      <span className="material-symbols-outlined text-[22px]">shopping_bag</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-4 pt-2 bg-gradient-to-r from-surface-container-low/50 to-transparent p-1.5 rounded-lg text-xs">
                    <span className="flex items-center text-secondary font-semibold">
                      <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                      {data.kpis.ordersGrowth}
                    </span>
                    <span className="text-on-surface-variant font-light">vs. previous period</span>
                  </div>
                </div>

                {/* KPI 3: Average Order Value */}
                <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm border border-secondary/15 flex flex-col justify-between hover:shadow-gold-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                        Average Order Value
                      </span>
                      <span className="font-serif text-3xl text-primary font-medium mt-1 tracking-tight">
                        ${data.kpis.averageOrderValue.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                      <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-4 pt-2 bg-gradient-to-r from-surface-container-low/50 to-transparent p-1.5 rounded-lg text-xs">
                    <span className="flex items-center text-secondary font-semibold">
                      <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                      {data.kpis.aovGrowth}
                    </span>
                    <span className="text-on-surface-variant font-light">vs. previous period</span>
                  </div>
                </div>

                {/* KPI 4: Conversion Rate */}
                <div className="p-6 rounded-xl bg-surface-container-lowest shadow-sm border border-secondary/15 flex flex-col justify-between hover:shadow-gold-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">
                        Store Conversion Rate
                      </span>
                      <span className="font-serif text-3xl text-primary font-medium mt-1 tracking-tight">
                        {data.kpis.conversionRate}%
                      </span>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center text-secondary shrink-0">
                      <span className="material-symbols-outlined text-[22px]">query_stats</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 mt-4 pt-2 bg-gradient-to-r from-surface-container-low/50 to-transparent p-1.5 rounded-lg text-xs">
                    <span className="flex items-center text-secondary font-semibold">
                      <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                      {data.kpis.conversionGrowth}
                    </span>
                    <span className="text-on-surface-variant font-light">vs. previous period</span>
                  </div>
                </div>
              </div>

              {/* Primary Analytics Area: Interactive SVG Sales Velocity Curve */}
              <div className="p-8 rounded-xl bg-surface-container-lowest shadow-sm border border-secondary/15 flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-bold">
                      PERFORMANCE CURVE
                    </span>
                    <h2 className="font-serif text-2xl text-primary font-normal mt-0.5">
                      Sales Velocity Trajectory &amp; Peak Campaign Days
                    </h2>
                  </div>

                  <div className="flex items-center gap-6 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                      <span className="text-on-surface font-medium">Daily Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary-gold" />
                      <span className="text-secondary font-semibold">Peak Campaign Days</span>
                    </div>
                  </div>
                </div>

                {/* SVG Line Chart with Spline and Golden Gradient Area */}
                <div className="w-full relative h-72 flex flex-col justify-end pt-4">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 240">
                    <defs>
                      <linearGradient id="goldCurveGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#C5A059" stopOpacity="0.38" />
                        <stop offset="60%" stopColor="#fed488" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#FAF6EE" stopOpacity="0.0" />
                      </linearGradient>
                      <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#C5A059" floodOpacity="0.3" />
                      </filter>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="0" y1="40" x2="800" y2="40" stroke="#f0ece6" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="100" x2="800" y2="100" stroke="#f0ece6" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="160" x2="800" y2="160" stroke="#f0ece6" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="0" y1="220" x2="800" y2="220" stroke="#e6e1da" strokeWidth="1" />

                    {/* Filled Gradient Area */}
                    <path
                      d="M 0 190 C 70 180, 130 160, 200 135 C 270 110, 330 70, 400 45 C 470 20, 530 90, 600 70 C 670 50, 730 65, 800 30 L 800 220 L 0 220 Z"
                      fill="url(#goldCurveGradient)"
                    />

                    {/* Main Spline Curve */}
                    <path
                      d="M 0 190 C 70 180, 130 160, 200 135 C 270 110, 330 70, 400 45 C 470 20, 530 90, 600 70 C 670 50, 730 65, 800 30"
                      fill="none"
                      stroke="#181615"
                      strokeWidth="2.5"
                    />

                    {/* Secondary Accent Curve */}
                    <path
                      d="M 0 190 C 70 180, 130 160, 200 135 C 270 110, 330 70, 400 45 C 470 20, 530 90, 600 70 C 670 50, 730 65, 800 30"
                      fill="none"
                      stroke="#C5A059"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      opacity="0.8"
                    />

                    {/* Peak Point Pin: 24k Light Launch */}
                    <g transform="translate(400, 45)">
                      <circle r="6" fill="#C5A059" stroke="#ffffff" strokeWidth="2" filter="url(#goldGlow)" />
                      <circle r="2" fill="#ffffff" />
                      <rect x="-60" y="-36" width="120" height="24" rx="4" fill="#181615" />
                      <text x="0" y="-20" fill="#ffdea5" fontSize="10" textAnchor="middle" fontFamily="Hanken Grotesk" fontWeight="600" letterSpacing="0.05em">
                        24K Gold Launch • $14.2k
                      </text>
                    </g>

                    {/* Peak Point Pin: Atelier Reserve */}
                    <g transform="translate(800, 30)">
                      <circle r="6" fill="#C5A059" stroke="#ffffff" strokeWidth="2" filter="url(#goldGlow)" />
                      <circle r="2" fill="#ffffff" />
                      <rect x="-95" y="-36" width="105" height="24" rx="4" fill="#181615" />
                      <text x="-42" y="-20" fill="#ffffff" fontSize="10" textAnchor="middle" fontFamily="Hanken Grotesk" fontWeight="600">
                        Peak Gala • $18.9k
                      </text>
                    </g>
                  </svg>

                  {/* X Axis Day Labels */}
                  <div className="flex justify-between text-[10px] uppercase font-mono text-outline pt-3">
                    <span>Oct 01</span>
                    <span>Oct 06</span>
                    <span>Oct 12</span>
                    <span>Oct 18</span>
                    <span>Oct 24</span>
                    <span>Oct 30</span>
                  </div>
                </div>
              </div>

              {/* Bottom 2-Column Grid: Top Formulations & Recent Sales */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Performing Formulations */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-secondary/15 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">SALON DEMAND</span>
                      <h3 className="font-serif text-xl text-primary font-normal">Top Performing Formulations</h3>
                    </div>
                    <span className="text-xs text-outline">Revenue Velocity</span>
                  </div>

                  <div className="space-y-3">
                    {data.topProducts.map((p, idx) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container-low transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-serif text-sm font-semibold text-secondary w-4">
                            0{idx + 1}
                          </span>
                          <img
                            src={p.image_url}
                            alt={p.title}
                            className="w-11 h-11 rounded-md object-cover border border-secondary/15 shrink-0"
                          />
                          <div>
                            <p className="text-xs font-semibold text-primary leading-tight">{p.title}</p>
                            <p className="text-[10px] uppercase tracking-wider text-outline">{p.category}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-serif text-sm font-bold text-primary block">
                            ${p.revenue.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-on-surface-variant">
                            {p.units_sold} flacons dispatched
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Transactions Stream */}
                <div className="bg-surface-container-lowest p-6 rounded-xl border border-secondary/15 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">LIVE TELEMETRY</span>
                      <h3 className="font-serif text-xl text-primary font-normal">Recent Transactions</h3>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] text-secondary font-semibold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" /> Live Stream
                    </span>
                  </div>

                  <div className="space-y-3">
                    {data.recentOrders.map(order => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-container-low transition-colors text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary font-mono text-[11px] font-semibold border border-secondary/15">
                            #{order.order_number.slice(-3)}
                          </div>
                          <div>
                            <p className="font-semibold text-primary">{order.customer_name}</p>
                            <p className="text-[10px] text-outline truncate max-w-[160px]">{order.customer_email}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-serif font-bold text-primary block">
                            ${order.total_amount.toFixed(2)}
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-semibold border ${getStatusBadge(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
